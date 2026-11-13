import { InvoiceItem, InvoiceRecord, PriceComparison } from '@/types/invoice';
import { getInvoiceRecords } from '@/lib/supabase';

export interface PriceCreepAnalysis {
  analyzedItems: InvoiceItem[];
  totalPriceHikeImpact: number;
  increasedCount: number;
  decreasedCount: number;
  unchangedCount: number;
  newCount: number;
  highestHikeItem?: {
    name: string;
    diffAmount: number;
    diffPercentage: number;
  };
}

/**
 * Normalizes item names for resilient Sri Lankan retail fuzzy matching
 * (Strips parentheticals, Sinhala notes, excess spaces, punctuation).
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove brackets like (සිමෙන්ති 50kg)
    .replace(/[^\w\s\u0D80-\u0DFF]/g, ' ') // keep alphanumerics & Sinhala Unicode
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes name into significant keywords (ignoring trivial words)
 */
function getKeywords(name: string): string[] {
  const stopWords = new Set(['and', 'or', 'the', 'type', 'nos', 'pkt', 'box', 'bag', 'grade', 'no']);
  return normalizeName(name)
    .split(' ')
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Calculates similarity between two item names (0 to 1)
 */
function calculateSimilarity(name1: string, name2: string): number {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);

  if (norm1 === norm2) return 1.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9;

  const kw1 = getKeywords(name1);
  const kw2 = getKeywords(name2);

  if (kw1.length === 0 || kw2.length === 0) return 0;

  const intersection = kw1.filter((k) => kw2.includes(k));
  const union = new Set([...kw1, ...kw2]);

  return intersection.length / union.size;
}

/**
 * Evaluates an invoice's line items against past store records to catch price creep.
 */
export async function analyzePriceCreep(
  currentItems: InvoiceItem[],
  currentInvoiceId?: string
): Promise<PriceCreepAnalysis> {
  const pastInvoices = await getInvoiceRecords();

  // Filter out current invoice to avoid self-matching
  const eligibleInvoices = pastInvoices
    .filter((inv) => !currentInvoiceId || inv.id !== currentInvoiceId)
    .sort((a, b) => {
      const dateA = new Date(a.invoice_date || a.created_at).getTime();
      const dateB = new Date(b.invoice_date || b.created_at).getTime();
      return dateB - dateA; // latest first
    });

  let totalPriceHikeImpact = 0;
  let increasedCount = 0;
  let decreasedCount = 0;
  let unchangedCount = 0;
  let newCount = 0;
  let highestHikeItem: { name: string; diffAmount: number; diffPercentage: number } | undefined;

  const analyzedItems = currentItems.map((item) => {
    // If unit price is missing, cannot compare
    if (item.unit_price == null || isNaN(Number(item.unit_price))) {
      return item;
    }

    const currentPrice = Number(item.unit_price);
    let bestMatch: { item: InvoiceItem; invoice: InvoiceRecord } | null = null;
    let highestScore = 0;

    for (const inv of eligibleInvoices) {
      for (const pastItem of inv.items) {
        if (pastItem.unit_price == null || isNaN(Number(pastItem.unit_price))) continue;

        // Code matching (pharma/hardware SKU)
        if (
          item.product_code &&
          pastItem.product_code &&
          item.product_code.trim().toLowerCase() === pastItem.product_code.trim().toLowerCase()
        ) {
          bestMatch = { item: pastItem, invoice: inv };
          highestScore = 1.0;
          break;
        }

        const score = calculateSimilarity(item.name, pastItem.name);
        if (score > highestScore && score >= 0.5) {
          highestScore = score;
          bestMatch = { item: pastItem, invoice: inv };
        }
      }
      if (highestScore >= 0.9) break; // Strong match found, stop searching older bills
    }

    if (!bestMatch) {
      newCount++;
      const comparison: PriceComparison = {
        previous_price: currentPrice,
        previous_date: '',
        diff_amount: 0,
        diff_percentage: 0,
        status: 'new',
      };
      return { ...item, price_comparison: comparison };
    }

    const prevPrice = Number(bestMatch.item.unit_price);
    const diff = Math.round((currentPrice - prevPrice) * 100) / 100;
    const diffPct = prevPrice > 0 ? Math.round(((currentPrice - prevPrice) / prevPrice) * 1000) / 10 : 0;

    let status: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
    if (diff > 0.5) {
      status = 'increased';
      increasedCount++;
      const qty = Number(item.quantity || 1);
      const impact = diff * qty;
      totalPriceHikeImpact += impact;

      if (!highestHikeItem || diffPct > highestHikeItem.diffPercentage) {
        highestHikeItem = {
          name: item.name,
          diffAmount: diff,
          diffPercentage: diffPct,
        };
      }
    } else if (diff < -0.5) {
      status = 'decreased';
      decreasedCount++;
    } else {
      unchangedCount++;
    }

    const comparison: PriceComparison = {
      previous_price: prevPrice,
      previous_date: bestMatch.invoice.invoice_date || bestMatch.invoice.created_at.split('T')[0],
      previous_vendor: bestMatch.invoice.vendor_name,
      diff_amount: diff,
      diff_percentage: diffPct,
      status,
    };

    return { ...item, price_comparison: comparison };
  });

  return {
    analyzedItems,
    totalPriceHikeImpact: Math.round(totalPriceHikeImpact * 100) / 100,
    increasedCount,
    decreasedCount,
    unchangedCount,
    newCount,
    highestHikeItem,
  };
}

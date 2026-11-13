import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InvoiceRecord, InvoiceStatus } from '@/types/invoice';

const LOCAL_STORAGE_KEY = 'lankabill_invoices_cache_v1';
const SETTINGS_STORAGE_KEY = 'lankabill_user_settings_v1';

export interface UserSettings {
  geminiApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  darkMode?: boolean;
  shopName?: string;
}

export function getUserSettings(): UserSettings {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save user settings:', err);
  }
}

// Get dynamic Supabase client
export function getSupabaseClient(): SupabaseClient | null {
  const settings = getUserSettings();
  const supabaseUrl = settings.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = settings.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
    try {
      return createClient(supabaseUrl, supabaseAnonKey);
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }
  return null;
}

// Local Storage Fallback helpers
function getLocalInvoices(): InvoiceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read local invoices:', e);
    return [];
  }
}

function saveLocalInvoices(invoices: InvoiceRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices to local storage:', e);
  }
}

/**
 * Saves or updates an invoice record.
 * Writes to Supabase if configured, and always keeps local storage up-to-date for instant offline resilience.
 */
export async function saveInvoiceRecord(record: InvoiceRecord): Promise<{ success: boolean; record: InvoiceRecord; sync: 'synced' | 'local_only' }> {
  // Always update local cache first
  const existing = getLocalInvoices();
  const index = existing.findIndex((i) => i.id === record.id);
  let updatedList: InvoiceRecord[];

  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = { ...record, updated_at: new Date().toISOString() };
  } else {
    updatedList = [record, ...existing];
  }
  saveLocalInvoices(updatedList);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      // Upsert into Supabase `invoices` table
      const { error: invoiceError } = await supabase.from('invoices').upsert({
        id: record.id,
        vendor_name: record.vendor_name,
        invoice_number: record.invoice_number,
        invoice_date: record.invoice_date,
        category: record.category,
        grand_total: record.grand_total,
        calculated_total: record.calculated_total,
        discrepancy: record.discrepancy,
        status: record.status,
        confidence_notes: record.confidence_notes,
        processing_time_ms: record.processing_time_ms,
        created_at: record.created_at,
        updated_at: new Date().toISOString(),
      });

      if (invoiceError) throw invoiceError;

      // Upsert line items
      if (record.items && record.items.length > 0) {
        // Delete old items for this invoice if updating
        await supabase.from('invoice_items').delete().eq('invoice_id', record.id);

        const itemsToInsert = record.items.map((item) => ({
          invoice_id: record.id,
          name: item.name,
          product_code: item.product_code || null,
          batch_no: item.batch_no || null,
          expiry_date: item.expiry_date || null,
          quantity: item.quantity,
          unit: item.unit || 'nos',
          unit_price: item.unit_price,
          retail_price: item.retail_price || null,
          discount_percent: item.discount_percent || null,
          discount: item.discount || null,
          total: item.total,
          is_flagged: item.isFlagged || false,
          flag_reason: item.flagReason || null,
        }));

        await supabase.from('invoice_items').insert(itemsToInsert);
      }

      // Add audit log entry
      await supabase.from('audit_logs').insert({
        invoice_id: record.id,
        action: index >= 0 ? 'UPDATE_INVOICE' : 'CREATE_INVOICE',
        performed_by: 'Shop Counter Staff',
        details: {
          grand_total: record.grand_total,
          item_count: record.items.length,
          status: record.status,
        },
      });

      const syncedRecord: InvoiceRecord = { ...record, sync_status: 'synced' };
      // update synced flag in local storage
      const finalLocals = getLocalInvoices().map((i) => (i.id === record.id ? syncedRecord : i));
      saveLocalInvoices(finalLocals);

      return { success: true, record: syncedRecord, sync: 'synced' };
    } catch (err) {
      console.warn('Supabase sync failed, cached locally:', err);
      return { success: true, record: { ...record, sync_status: 'local_only' }, sync: 'local_only' };
    }
  }

  return { success: true, record: { ...record, sync_status: 'local_only' }, sync: 'local_only' };
}

/**
 * Fetch all invoice records.
 */
export async function getInvoiceRecords(): Promise<InvoiceRecord[]> {
  const localList = getLocalInvoices();
  const supabase = getSupabaseClient();

  if (!supabase) {
    return localList;
  }

  try {
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .order('created_at', { ascending: false });

    if (error || !invoices) {
      return localList;
    }

    // Transform Supabase rows to InvoiceRecord[]
    const mapped: InvoiceRecord[] = invoices.map((inv: any) => ({
      id: inv.id,
      vendor_name: inv.vendor_name,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      category: inv.category,
      grand_total: Number(inv.grand_total),
      calculated_total: Number(inv.calculated_total),
      discrepancy: Number(inv.discrepancy),
      status: inv.status as InvoiceStatus,
      confidence_notes: inv.confidence_notes,
      processing_time_ms: inv.processing_time_ms,
      image_url: inv.image_url,
      created_at: inv.created_at,
      sync_status: 'synced',
      items: (inv.invoice_items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        product_code: it.product_code || null,
        batch_no: it.batch_no || null,
        expiry_date: it.expiry_date || null,
        quantity: it.quantity != null ? Number(it.quantity) : null,
        unit: it.unit,
        unit_price: it.unit_price != null ? Number(it.unit_price) : null,
        retail_price: it.retail_price != null ? Number(it.retail_price) : null,
        discount_percent: it.discount_percent != null ? Number(it.discount_percent) : null,
        discount: it.discount != null ? Number(it.discount) : null,
        total: it.total != null ? Number(it.total) : null,
        isFlagged: Boolean(it.is_flagged),
        flagReason: it.flag_reason,
      })),
    }));

    // Merge with any un-synced local records
    const unSynced = localList.filter((l) => l.sync_status === 'local_only' && !mapped.some((m) => m.id === l.id));
    const combined = [...unSynced, ...mapped];
    saveLocalInvoices(combined);
    return combined;
  } catch (err) {
    console.warn('Failed to query Supabase, returning local list:', err);
    return localList;
  }
}

/**
 * Delete an invoice record.
 */
export async function deleteInvoiceRecord(id: string): Promise<boolean> {
  const locals = getLocalInvoices().filter((i) => i.id !== id);
  saveLocalInvoices(locals);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('invoices').delete().eq('id', id);
    } catch (e) {
      console.warn('Failed to delete in Supabase:', e);
    }
  }
  return true;
}

/**
 * Export invoices list to CSV format for Excel or Sri Lankan Accounting.
 */
export function exportInvoicesToCsv(invoices: InvoiceRecord[]): void {
  const headers = [
    'Invoice ID',
    'Vendor Name',
    'Invoice Number',
    'Date',
    'Category',
    'Item Code',
    'Item Name',
    'Batch No',
    'Expiry Date',
    'Qty',
    'Unit',
    'Wholesale Price (LKR)',
    'Retail MRP (LKR)',
    'Trade Disc %',
    'Line Total (LKR)',
    'Invoice Grand Total (LKR)',
    'Discrepancy (LKR)',
    'Status',
    'Created At'
  ];

  const rows: string[][] = [];

  for (const inv of invoices) {
    if (inv.items && inv.items.length > 0) {
      for (const item of inv.items) {
        rows.push([
          `"${inv.id}"`,
          `"${(inv.vendor_name || '').replace(/"/g, '""')}"`,
          `"${(inv.invoice_number || '').replace(/"/g, '""')}"`,
          `"${inv.invoice_date || ''}"`,
          `"${inv.category}"`,
          `"${(item.product_code || '').replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.batch_no || '').replace(/"/g, '""')}"`,
          `"${(item.expiry_date || '').replace(/"/g, '""')}"`,
          (item.quantity ?? '').toString(),
          `"${item.unit || 'nos'}"`,
          item.unit_price != null ? item.unit_price.toFixed(2) : '',
          item.retail_price != null ? item.retail_price.toFixed(2) : '',
          item.discount_percent != null ? `${item.discount_percent}%` : '',
          item.total != null ? item.total.toFixed(2) : '',
          inv.grand_total.toFixed(2),
          inv.discrepancy.toFixed(2),
          `"${inv.status}"`,
          `"${inv.created_at}"`
        ]);
      }
    } else {
      rows.push([
        `"${inv.id}"`,
        `"${(inv.vendor_name || '').replace(/"/g, '""')}"`,
        `"${(inv.invoice_number || '').replace(/"/g, '""')}"`,
        `"${inv.invoice_date || ''}"`,
        `"${inv.category}"`,
        '""',
        '""',
        '""',
        '""',
        '0',
        '""',
        '0.00',
        '0.00',
        '0%',
        '0.00',
        inv.grand_total.toFixed(2),
        inv.discrepancy.toFixed(2),
        `"${inv.status}"`,
        `"${inv.created_at}"`
      ]);
    }
  }

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SriLanka_Bills_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate Google Sheets friendly format (TSV) to paste directly into Google Sheets.
 */
export function generateGoogleSheetsTsv(invoices: InvoiceRecord[]): string {
  const headers = ['Date', 'Vendor', 'Invoice No', 'Category', 'Code', 'Item Description', 'Batch/Exp', 'Qty', 'Unit', 'Price (Rs.)', 'MRP (Rs.)', 'Disc %', 'Total (Rs.)', 'Bill Grand Total', 'Status'];
  const rows: string[] = [headers.join('\t')];

  for (const inv of invoices) {
    if (inv.items && inv.items.length > 0) {
      for (const item of inv.items) {
        rows.push([
          inv.invoice_date || '',
          inv.vendor_name || '',
          inv.invoice_number || '',
          inv.category,
          item.product_code || '',
          item.name,
          `${item.batch_no || ''}${item.expiry_date ? ` (${item.expiry_date})` : ''}`.trim(),
          (item.quantity ?? '').toString(),
          item.unit || 'nos',
          item.unit_price != null ? item.unit_price.toString() : '',
          item.retail_price != null ? item.retail_price.toString() : '',
          item.discount_percent != null ? `${item.discount_percent}%` : '',
          item.total != null ? item.total.toString() : '',
          inv.grand_total.toString(),
          inv.status
        ].join('\t'));
      }
    }
  }

  return rows.join('\n');
}

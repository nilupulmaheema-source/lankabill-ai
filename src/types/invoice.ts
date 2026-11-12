import { z } from 'zod';
import type { CompressionResult } from '@/lib/imageCompression';

// ============================================================================
// 1. Nominal / Branded Types (Matt Pocock Total TypeScript Pattern)
// Prevents accidentally mixing up arbitrary strings or raw numbers
// ============================================================================
declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type InvoiceId = Brand<string, 'InvoiceId'>;
export type ItemId = Brand<string, 'ItemId'>;
export type CurrencyLKR = Brand<number, 'LKR'>;

export const asInvoiceId = (id: string): InvoiceId => id as InvoiceId;
export const asItemId = (id: string): ItemId => id as ItemId;
export const asLKR = (amount: number): CurrencyLKR => amount as CurrencyLKR;

// ============================================================================
// 2. Constants as Single Source of Truth (`as const` + Indexed Access)
// ============================================================================
export const INVOICE_CATEGORIES = ['Pharmacy', 'Hardware', 'General', 'Utilities'] as const;
export type InvoiceCategory = (typeof INVOICE_CATEGORIES)[number];
export const InvoiceCategoryValues = INVOICE_CATEGORIES;

export const INVOICE_STATUSES = ['Pending Verification', 'Approved', 'Flagged'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PACKAGING_UNITS = [
  'nos',
  'pkt',
  'cube',
  'kg',
  'bundle',
  'mtr',
  'roll',
  'box',
  'btl',
  'tin',
  'bag',
  'sheet',
  'sqft',
  'strip',
  'tab',
  'cap',
  'g',
  'ml',
  'l',
] as const;
export type PackagingUnit = (typeof PACKAGING_UNITS)[number];

// ============================================================================
// 3. Category Metadata strictly validated with `satisfies`
// Validates full coverage without widening literal types!
// ============================================================================
export interface CategoryConfig {
  readonly label: string;
  readonly badgeClass: string;
  readonly defaultUnit: PackagingUnit;
}

export const CATEGORY_CONFIG = {
  Pharmacy: {
    label: 'Pharmacy & Medical',
    badgeClass: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
    defaultUnit: 'box',
  },
  Hardware: {
    label: 'Hardware & Materials',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    defaultUnit: 'nos',
  },
  General: {
    label: 'General Retail',
    badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
    defaultUnit: 'nos',
  },
  Utilities: {
    label: 'Utilities & Services',
    badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    defaultUnit: 'nos',
  },
} as const satisfies Record<InvoiceCategory, CategoryConfig>;

// ============================================================================
// 4. Zod Schemas with Coercion & Inferred Types (Day 1 Calibrated)
// ============================================================================
export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().nullable().optional(),
  unit: z.string().default('nos'),
  unit_price: z.number().nullable().optional(),
  total: z.number().nullable().optional(),
  is_illegible: z.boolean().optional(),
  isFlagged: z.boolean().optional(),
  flagReason: z.string().optional(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceExtractionSchema = z.object({
  vendor_name: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  category: z.enum(INVOICE_CATEGORIES).default('General'),
  items: z.array(InvoiceItemSchema).default([]),
  subtotal: z.number().nullable().optional(),
  discount: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  grand_total: z.coerce.number().nonnegative().default(0),
  confidence_notes: z.string().nullable().optional(),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

// ============================================================================
// 5. Discriminated Union for Arithmetic Integrity Check
// Making illegal states unrepresentable: balanced state can never have diff > 0
// Day 1 SLA: Tolerance threshold <= Rs. 1.00; accounts for discount & tax
// ============================================================================
export type IntegrityCheckResult =
  | {
      readonly status: 'balanced';
      readonly calculatedTotal: number;
      readonly grandTotal: number;
      readonly subtotal?: number | null;
      readonly discount?: number | null;
      readonly tax?: number | null;
      readonly diff: 0;
    }
  | {
      readonly status: 'discrepancy';
      readonly calculatedTotal: number;
      readonly grandTotal: number;
      readonly subtotal?: number | null;
      readonly discount?: number | null;
      readonly tax?: number | null;
      readonly diff: number;
      readonly flaggedLineCount: number;
      readonly missingValuesCount: number;
    };

export function checkArithmeticIntegrity(
  items: readonly InvoiceItem[],
  grandTotal: number,
  options?: {
    subtotal?: number | null;
    discount?: number | null;
    tax?: number | null;
    tolerance?: number;
  }
): IntegrityCheckResult {
  const tolerance = options?.tolerance ?? 1.0;
  let missingValuesCount = 0;

  // Sum line totals, detecting illegible / missing numbers
  const sumOfLines = items.reduce((sum, item) => {
    if (item.total === null || item.total === undefined || isNaN(Number(item.total))) {
      missingValuesCount++;
      return sum;
    }
    return sum + Number(item.total);
  }, 0);

  // If subtotal is present, use it as the base; otherwise sum of lines
  const effectiveBase = options?.subtotal != null ? Number(options.subtotal) : sumOfLines;
  const discount = Number(options?.discount || 0);
  const tax = Number(options?.tax || 0);

  // Expected Grand Total = Base - Discount + Tax
  const expectedGrandTotal = effectiveBase - discount + tax;

  const roundedCalculated = Math.round(expectedGrandTotal * 100) / 100;
  const roundedGrand = Math.round(Number(grandTotal || 0) * 100) / 100;
  const diff = Math.round(Math.abs(roundedCalculated - roundedGrand) * 100) / 100;

  // Check row-level arithmetic: does quantity * unit_price == total for each item?
  let rowLevelErrorsCount = 0;
  for (const item of items) {
    if (item.quantity != null && item.unit_price != null && item.total != null) {
      const expectedLineTotal = Math.round(Number(item.quantity) * Number(item.unit_price) * 100) / 100;
      if (Math.abs(expectedLineTotal - Number(item.total)) > tolerance) {
        rowLevelErrorsCount++;
      }
    }
  }

  const flaggedLineCount = items.filter((it) => it.isFlagged || it.is_illegible).length + rowLevelErrorsCount;

  if (diff <= tolerance && missingValuesCount === 0 && rowLevelErrorsCount === 0) {
    return {
      status: 'balanced',
      calculatedTotal: roundedCalculated,
      grandTotal: roundedGrand,
      subtotal: options?.subtotal,
      discount: options?.discount,
      tax: options?.tax,
      diff: 0,
    };
  }

  return {
    status: 'discrepancy',
    calculatedTotal: roundedCalculated,
    grandTotal: roundedGrand,
    subtotal: options?.subtotal,
    discount: options?.discount,
    tax: options?.tax,
    diff: diff > 0 ? diff : (rowLevelErrorsCount > 0 ? 1 : 0),
    flaggedLineCount,
    missingValuesCount,
  };
}

// ============================================================================
// 6. Discriminated Union for Scanner Workflow State Machine
// ============================================================================
export type ScannerWorkflowState =
  | { readonly status: 'idle' }
  | { readonly status: 'compressing'; readonly elapsedSeconds: number; readonly progressStep: string }
  | { readonly status: 'analyzing'; readonly elapsedSeconds: number; readonly progressStep: string; readonly compression?: CompressionResult }
  | { readonly status: 'reviewing'; readonly data: InvoiceExtraction; readonly imageUrl: string; readonly processingTimeMs: number }
  | { readonly status: 'error'; readonly errorMessage: string; readonly timestamp: number };

// ============================================================================
// 7. Discriminated Union for API Responses
// ============================================================================
export type ApiResponse<T> =
  | {
      readonly success: true;
      readonly data: T;
      readonly displayImageUrl?: string;
      readonly processingTimeMs: number;
      readonly isSimulated: boolean;
      readonly notice?: string;
      readonly notes?: string;
    }
  | {
      readonly success: false;
      readonly error: string;
      readonly processingTimeMs?: number;
    };

export type ExtractionResponse = ApiResponse<InvoiceExtraction>;

// ============================================================================
// 8. Invoice Record & Audit Log Models
// ============================================================================
export interface AuditLogEntry {
  readonly timestamp: string;
  readonly action: string;
  readonly user: string;
  readonly note?: string;
}

export interface InvoiceRecord {
  readonly id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  category: InvoiceCategory;
  items: InvoiceItem[];
  subtotal?: number | null;
  discount?: number | null;
  tax?: number | null;
  grand_total: number;
  calculated_total: number;
  discrepancy: number;
  status: InvoiceStatus;
  confidence_notes?: string | null;
  image_url?: string;
  created_at: string;
  updated_at?: string;
  processing_time_ms?: number;
  sync_status: 'synced' | 'local_only' | 'error';
  audit_logs?: AuditLogEntry[];
}

// ============================================================================
// 9. Exhaustive Switch / Pattern Matching Helper (Matt Pocock Signature)
// Guarantees all cases of a union are handled at compile time
// ============================================================================
export function assertNever(x: never, message?: string): never {
  throw new Error(message ?? `Unexpected value in exhaustive check: ${JSON.stringify(x)}`);
}

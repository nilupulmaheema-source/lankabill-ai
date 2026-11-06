import { z } from 'zod';

export type InvoiceCategory = 'Pharmacy' | 'Hardware' | 'General' | 'Utilities';

export const InvoiceCategoryValues: [InvoiceCategory, ...InvoiceCategory[]] = [
  'Pharmacy',
  'Hardware',
  'General',
  'Utilities'
];

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().nonnegative(),
  unit: z.string().optional().default('nos'),
  unit_price: z.number().nonnegative(),
  total: z.number().nonnegative(),
  isFlagged: z.boolean().optional(),
  flagReason: z.string().optional(),
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

export const InvoiceExtractionSchema = z.object({
  vendor_name: z.string().nullable().optional(),
  invoice_number: z.string().nullable().optional(),
  invoice_date: z.string().nullable().optional(),
  category: z.enum(['Pharmacy', 'Hardware', 'General', 'Utilities']).default('General'),
  items: z.array(InvoiceItemSchema).default([]),
  grand_total: z.number().nonnegative().default(0),
  confidence_notes: z.string().nullable().optional(),
});

export type InvoiceExtraction = z.infer<typeof InvoiceExtractionSchema>;

export type InvoiceStatus = 'Pending Verification' | 'Approved' | 'Flagged';

export interface InvoiceRecord {
  id: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  category: InvoiceCategory;
  items: InvoiceItem[];
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

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  user: string;
  note?: string;
}

export interface ExtractionResponse {
  success: boolean;
  data?: InvoiceExtraction;
  processingTimeMs?: number;
  error?: string;
  isSimulated?: boolean;
}

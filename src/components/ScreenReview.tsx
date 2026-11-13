'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  RotateCcw,
  Sparkles,
  Calculator,
  Building,
  Hash,
  Calendar,
  Layers,
  Split,
  Eye,
  FileEdit,
  Wand2,
} from 'lucide-react';
import { PanZoomViewer } from './PanZoomViewer';
import {
  InvoiceExtraction,
  InvoiceItem,
  InvoiceCategory,
  InvoiceCategoryValues,
  InvoiceRecord,
  checkArithmeticIntegrity,
  CATEGORY_CONFIG,
} from '@/types/invoice';

interface ScreenReviewProps {
  initialData: InvoiceExtraction;
  imageUrl: string;
  processingTimeMs: number;
  onSave: (record: InvoiceRecord) => void;
  onDiscard: () => void;
}

export function ScreenReview({
  initialData,
  imageUrl,
  processingTimeMs,
  onSave,
  onDiscard,
}: ScreenReviewProps) {
  // Header form states
  const [vendorName, setVendorName] = useState(initialData.vendor_name || '');
  const [invoiceNumber, setInvoiceNumber] = useState(initialData.invoice_number || '');
  const [invoiceDate, setInvoiceDate] = useState(
    initialData.invoice_date || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<InvoiceCategory>(
    (initialData.category as InvoiceCategory) || 'General'
  );
  const [grandTotalInput, setGrandTotalInput] = useState<number>(
    initialData.grand_total || 0
  );
  const [subtotalInput, setSubtotalInput] = useState<number | null>(
    initialData.subtotal ?? null
  );
  const [discountInput, setDiscountInput] = useState<number | null>(
    initialData.discount ?? null
  );
  const [taxInput, setTaxInput] = useState<number | null>(
    initialData.tax ?? null
  );

  // Line items state with automatic total and discount inference
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    const sub = initialData.subtotal || 0;
    const disc = initialData.discount || 0;
    const inferredDiscPct = sub > 0 && disc > 0 ? Math.round((disc / sub) * 100 * 10) / 10 : null;

    return (initialData.items || []).map((it, idx) => {
      const discPct = it.discount_percent ?? inferredDiscPct ?? 0;
      let lineTotal = it.total ?? null;

      // Auto-compute line total if not provided by OCR but qty & price exist
      if (lineTotal == null && it.quantity != null && it.unit_price != null) {
        const raw = Number(it.quantity) * Number(it.unit_price);
        lineTotal = Math.round(raw * (1 - discPct / 100) * 100) / 100;
      }

      return {
        ...it,
        id: it.id || `item-${Date.now()}-${idx}`,
        unit: it.unit || 'nos',
        quantity: it.quantity ?? null,
        free_quantity: it.free_quantity ?? null,
        unit_price: it.unit_price ?? null,
        discount_percent: discPct > 0 ? discPct : (it.discount_percent ?? 0),
        total: lineTotal,
      };
    });
  });

  // Mobile layout mode: 'split' | 'photo' | 'form'
  const [mobileView, setMobileView] = useState<'split' | 'photo' | 'form'>('split');
  const [isSaving, setIsSaving] = useState(false);

  // Arithmetic Integrity Check (Discriminated Union pattern with Day 1 Calibrated Tolerance)
  const integrity = useMemo(
    () =>
      checkArithmeticIntegrity(items, grandTotalInput, {
        subtotal: subtotalInput,
        discount: discountInput,
        tax: taxInput,
        tolerance: 1.0,
      }),
    [items, grandTotalInput, subtotalInput, discountInput, taxInput]
  );
  const calculatedTotal = integrity.calculatedTotal;
  const hasDiscrepancy = integrity.status === 'discrepancy';
  const discrepancy = integrity.status === 'discrepancy' ? integrity.diff : 0;

  // Update item field
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        // Auto-recalculate line total if quantity, unit_price, retail_price, or discount_percent was modified
        if (
          field === 'quantity' ||
          field === 'unit_price' ||
          field === 'retail_price' ||
          field === 'discount_percent' ||
          field === 'discount'
        ) {
          const qty = field === 'quantity' ? (value === '' || value === null ? null : Number(value)) : updated.quantity;
          const price = field === 'unit_price' ? (value === '' || value === null ? null : Number(value)) : updated.unit_price;
          const discPct = field === 'discount_percent' ? (value === '' || value === null ? null : Number(value)) : updated.discount_percent;
          const discAmt = field === 'discount' ? (value === '' || value === null ? null : Number(value)) : updated.discount;

          if (qty != null && price != null) {
            const rawLine = qty * price;
            let netLine = rawLine;

            if (discPct != null && Number(discPct) > 0) {
              netLine = rawLine * (1 - Number(discPct) / 100);
            } else if (discAmt != null && Number(discAmt) > 0) {
              netLine = rawLine - Number(discAmt);
            }

            updated.total = Math.round(netLine * 100) / 100;
            updated.is_illegible = false;
          }
        }

        // Check row-level arithmetic integrity
        if (updated.quantity == null || updated.unit_price == null || updated.total == null) {
          updated.isFlagged = true;
          updated.flagReason = 'Missing or illegible figure on bill';
        } else {
          const rawLine = Number(updated.quantity) * Number(updated.unit_price);
          let lineExpected = rawLine;
          if (updated.discount_percent != null && Number(updated.discount_percent) > 0) {
            lineExpected = rawLine * (1 - Number(updated.discount_percent) / 100);
          } else if (updated.discount != null && Number(updated.discount) > 0) {
            lineExpected = rawLine - Number(updated.discount);
          }
          lineExpected = Math.round(lineExpected * 100) / 100;

          if (Math.abs(lineExpected - Number(updated.total)) > 1.0) {
            updated.isFlagged = true;
            updated.flagReason = `Diff: Expected Rs. ${lineExpected.toFixed(2)} (Qty: ${updated.quantity}, Rate: ${updated.unit_price}${updated.discount_percent ? `, Disc: ${updated.discount_percent}%` : ''})`;
          } else {
            updated.isFlagged = false;
            updated.flagReason = undefined;
          }
        }

        return updated;
      })
    );
  };

  // Add new blank row
  const handleAddRow = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      name: '',
      product_code: '',
      batch_no: '',
      expiry_date: '',
      quantity: 1,
      free_quantity: 0,
      unit: category === 'Pharmacy' ? 'box' : 'nos',
      unit_price: 0,
      retail_price: 0,
      discount_percent: 0,
      total: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Auto-Fix: Apply Calculated Total to Grand Total
  const handleAutoFixGrandTotal = () => {
    setGrandTotalInput(Math.round(calculatedTotal * 100) / 100);
  };

  // Recalculate all row totals based on qty * unit_price (with discounts accounted for)
  const handleRecalculateAllRows = () => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.quantity != null && it.unit_price != null) {
          const rawLine = Number(it.quantity) * Number(it.unit_price);
          let netLine = rawLine;
          if (it.discount_percent != null && Number(it.discount_percent) > 0) {
            netLine = rawLine * (1 - Number(it.discount_percent) / 100);
          } else if (it.discount != null && Number(it.discount) > 0) {
            netLine = rawLine - Number(it.discount);
          }
          return {
            ...it,
            total: Math.round(netLine * 100) / 100,
            isFlagged: false,
            flagReason: undefined,
          };
        }
        return {
          ...it,
          isFlagged: true,
          flagReason: 'Missing or illegible figure on bill',
        };
      })
    );
  };

  // Apply uniform discount % across all line items
  const handleApplyAllDiscount = (pct: number) => {
    setItems((prev) =>
      prev.map((it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.unit_price) || 0;
        const rawLine = qty * price;
        const netLine = rawLine * (1 - pct / 100);
        return {
          ...it,
          discount_percent: pct,
          total: Math.round(netLine * 100) / 100,
          isFlagged: false,
          flagReason: undefined,
        };
      })
    );
  };

  // Confirm and Save
  const handleConfirmSave = () => {
    setIsSaving(true);
    const newRecord: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      vendor_name: vendorName.trim() || 'Unknown Sri Lankan Vendor',
      invoice_number: invoiceNumber.trim() || 'N/A',
      invoice_date: invoiceDate,
      category,
      items,
      subtotal: subtotalInput,
      discount: discountInput,
      tax: taxInput,
      grand_total: Number(grandTotalInput) || 0,
      calculated_total: Math.round(calculatedTotal * 100) / 100,
      discrepancy: Math.round(discrepancy * 100) / 100,
      status: hasDiscrepancy ? 'Flagged' : 'Approved',
      confidence_notes: initialData.confidence_notes,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      processing_time_ms: processingTimeMs,
      sync_status: 'local_only',
      audit_logs: [
        {
          timestamp: new Date().toISOString(),
          action: 'VERIFIED_AND_CONFIRMED',
          user: 'Counter Staff',
          note: hasDiscrepancy
            ? `Flagged with discrepancy of Rs. ${discrepancy.toFixed(2)}`
            : 'Verified with zero arithmetic discrepancy',
        },
      ],
    };

    onSave(newRecord);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 space-y-4">
      {/* Top Banner & Timing Benchmark */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Back to Capture"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Side-by-Side Bill Verification
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Ready for Review
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cross-check Gemini vision extraction with original document.
            </p>
          </div>
        </div>

        {/* Mobile View Toggle Pills */}
        <div className="flex lg:hidden items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setMobileView('photo')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
              mobileView === 'photo'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('split')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
              mobileView === 'split'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Stacked</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('form')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
              mobileView === 'form'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Form</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5" />
            Extracted in {(processingTimeMs / 1000).toFixed(2)}s
          </span>
        </div>
      </div>

      {/* CORE SPLIT SCREEN: LEFT PHOTO (Pan & Zoom) vs RIGHT EDITABLE FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / TOP: Interactive Pan-and-Zoom Bill Viewport */}
        <div
          className={`lg:col-span-5 h-[380px] lg:h-[720px] sticky top-20 ${
            mobileView === 'form' ? 'hidden lg:block' : 'block'
          }`}
        >
          <PanZoomViewer imageUrl={imageUrl} alt={vendorName || 'Supplier Bill'} />
        </div>

        {/* RIGHT / BOTTOM: Editable Form */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileView === 'photo' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* HEADER METADATA FIELDS CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>Invoice Header Details</span>
              </h3>
              <span className="text-[11px] text-slate-400">Click any field to edit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Tokyo Cement, Western Pharma..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Invoice / Chit No.
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Retail Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InvoiceCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {InvoiceCategoryValues.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ARITHMETIC INTEGRITY CHECK BANNER */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              hasDiscrepancy
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {hasDiscrepancy ? (
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {hasDiscrepancy
                      ? `⚠️ Discrepancy detected: Diff of Rs. ${discrepancy.toLocaleString('en-LK', {
                          minimumFractionDigits: 2,
                        })}`
                      : 'Arithmetic Integrity Verified (Zero Discrepancy)'}
                  </h4>
                  <p className="text-xs text-slate-300">
                    Calculated Line Sum: <b className="font-mono">Rs. {calculatedTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</b> | Bill Grand Total: <b className="font-mono">Rs. {Number(grandTotalInput).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</b>
                  </p>
                </div>
              </div>

              {hasDiscrepancy && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAutoFixGrandTotal}
                    className="flex-1 sm:flex-initial text-xs font-semibold px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow flex items-center justify-center gap-1"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Balance Total</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRecalculateAllRows}
                    className="flex-1 sm:flex-initial text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                    title="Recalculate row totals from Qty x Price"
                  >
                    Sync Lines
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* LINE ITEMS TABLE (EDITABLE) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Itemized Line Items ({items.length})
                </h3>
                {category === 'Pharmacy' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Pharma Distribution Mode
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {category === 'Pharmacy' && (
                  <button
                    type="button"
                    onClick={() => handleApplyAllDiscount(8)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-teal-800/80 hover:bg-teal-700 text-teal-200 border border-teal-600 transition-colors"
                    title="Apply standard 8% Sri Lankan pharma distributor trade discount to all items"
                  >
                    <span>⚡ Apply 8% Trade Disc</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            {/* Mobile Cards for < 640px / Responsive Table for >= 640px */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    {category === 'Pharmacy' ? (
                      <>
                        <th className="py-2.5 px-2 min-w-[85px] w-20">Item Code</th>
                        <th className="py-2.5 px-3 min-w-[170px]">Drug / Item Description</th>
                        <th className="py-2.5 px-2 min-w-[100px] w-24">Batch / Exp</th>
                        <th className="py-2.5 px-2 w-16 text-center">Billed Qty</th>
                        <th className="py-2.5 px-2 w-16 text-center text-teal-400">Bonus Qty</th>
                        <th className="py-2.5 px-2 w-14 text-center">Unit</th>
                        <th className="py-2.5 px-2 min-w-[90px] text-right">Wholesale (Rs.)</th>
                        <th className="py-2.5 px-2 min-w-[85px] text-right">MRP (Rs.)</th>
                        <th className="py-2.5 px-2 w-14 text-right">Disc %</th>
                        <th className="py-2.5 px-2 min-w-[105px] text-right">Net Total (Rs.)</th>
                        <th className="py-2.5 px-2 w-8 text-center"></th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 min-w-[180px]">Item Description</th>
                        <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                        <th className="py-2.5 px-2 w-20">Unit</th>
                        <th className="py-2.5 px-2 min-w-[110px] text-right">Unit Price (LKR)</th>
                        <th className="py-2.5 px-2 min-w-[120px] text-right">Total (LKR)</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.isFlagged
                          ? 'bg-amber-950/30 hover:bg-amber-950/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {category === 'Pharmacy' ? (
                        <>
                          {/* Product Code */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.product_code || ''}
                              onChange={(e) => handleItemChange(item.id!, 'product_code', e.target.value)}
                              placeholder="Code"
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 uppercase"
                            />
                          </td>

                          {/* Description */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id!, 'name', e.target.value)}
                              placeholder="Panadol 500mg, Amox 250..."
                              className={`w-full bg-slate-950/80 border rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 ${
                                item.isFlagged ? 'border-amber-500/60 font-semibold' : 'border-slate-700'
                              }`}
                            />
                            {item.is_illegible && (
                              <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                                ⚠️ Torn or illegible field detected
                              </span>
                            )}
                            {item.flagReason && !item.is_illegible && (
                              <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                                ⚠️ {item.flagReason}
                              </span>
                            )}
                          </td>

                          {/* Batch & Expiry */}
                          <td className="p-2">
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.batch_no || ''}
                                onChange={(e) => handleItemChange(item.id!, 'batch_no', e.target.value)}
                                placeholder="B.No (e.g. GS881)"
                                className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
                              />
                              <input
                                type="text"
                                value={item.expiry_date || ''}
                                onChange={(e) => handleItemChange(item.id!, 'expiry_date', e.target.value)}
                                placeholder="Exp (MM/YY)"
                                className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1 text-[11px] text-slate-400 font-mono focus:outline-none focus:border-emerald-500"
                              />
                            </div>
                          </td>

                          {/* Billed Qty */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={item.quantity ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'quantity', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1.5 text-center text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Bonus / Free Qty */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={item.free_quantity ?? ''}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'free_quantity', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-teal-500/40 rounded px-1.5 py-1.5 text-center text-teal-300 font-mono focus:outline-none focus:border-teal-400"
                              title="Free Issue / Bonus stock (F.O.C.)"
                            />
                          </td>

                          {/* Unit */}
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={item.unit || 'box'}
                              onChange={(e) => handleItemChange(item.id!, 'unit', e.target.value)}
                              placeholder="strip/box"
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-1 py-1.5 text-center text-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Trade / Cost Unit Price */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price ?? ''}
                              placeholder="Cost"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'unit_price', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1.5 text-right text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Retail / MRP Price */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.retail_price ?? ''}
                              placeholder="MRP"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'retail_price', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-1.5 py-1.5 text-right text-slate-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Trade Discount % */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.1"
                              value={item.discount_percent ?? ''}
                              placeholder="0%"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'discount_percent', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-1 py-1.5 text-right text-teal-300 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Net Total */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.total ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'total', val === '' ? null : parseFloat(val));
                              }}
                              className={`w-full bg-slate-950/80 border rounded px-1.5 py-1.5 text-right font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                                item.isFlagged
                                  ? 'border-amber-500 text-amber-300 bg-amber-950/40'
                                  : 'border-slate-700 text-emerald-400'
                              }`}
                            />
                          </td>

                          {/* Action Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item.id!)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Standard Description */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(item.id!, 'name', e.target.value)}
                              placeholder="Item name (සිමෙන්ති / Cable / Pipe)"
                              className={`w-full bg-slate-950/80 border rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 ${
                                item.isFlagged ? 'border-amber-500/60 font-semibold' : 'border-slate-700'
                              }`}
                            />
                            {item.is_illegible && (
                              <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                                ⚠️ Torn or illegible field detected on bill (Null guardrail active)
                              </span>
                            )}
                            {item.flagReason && !item.is_illegible && (
                              <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                                ⚠️ {item.flagReason}
                              </span>
                            )}
                          </td>

                          {/* Standard Qty */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              step="any"
                              value={item.quantity ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'quantity', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1.5 text-center text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Standard Unit */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.unit || 'nos'}
                              onChange={(e) => handleItemChange(item.id!, 'unit', e.target.value)}
                              placeholder="nos/pkt/cube"
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1.5 text-center text-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Standard Unit Price */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'unit_price', val === '' ? null : parseFloat(val));
                              }}
                              className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-right text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </td>

                          {/* Standard Total */}
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.total ?? ''}
                              placeholder="-"
                              onChange={(e) => {
                                const val = e.target.value.trim();
                                handleItemChange(item.id!, 'total', val === '' ? null : parseFloat(val));
                              }}
                              className={`w-full bg-slate-950/80 border rounded px-2.5 py-1.5 text-right font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                                item.isFlagged
                                  ? 'border-amber-500 text-amber-300 bg-amber-950/40'
                                  : 'border-slate-700 text-emerald-400'
                              }`}
                            />
                          </td>

                          {/* Action Delete */}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(item.id!)}
                              className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={category === 'Pharmacy' ? 11 : 6} className="text-center py-8 text-slate-400 text-xs">
                        No line items found. Click "Add Row" to enter items manually.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer Row */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[11px] text-slate-400 block">Calculated Total</span>
                  <span className="font-mono text-sm font-bold text-slate-200">
                    Rs. {calculatedTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pl-4 border-l border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Bill Grand Total (LKR)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={grandTotalInput}
                      onChange={(e) => setGrandTotalInput(parseFloat(e.target.value) || 0)}
                      className={`w-36 bg-slate-950 border rounded px-2.5 py-1 text-right text-base font-extrabold font-mono focus:outline-none ${
                        hasDiscrepancy
                          ? 'border-amber-500 text-amber-300 bg-amber-950/30'
                          : 'border-emerald-500 text-emerald-400'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Confidence Notes */}
          {initialData.confidence_notes && (
            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold text-slate-300">Gemini Flash AI Notes:</span>{' '}
                {initialData.confidence_notes}
              </p>
            </div>
          )}

          {/* BOTTOM ACTION BAR */}
          <div className="sticky bottom-3 z-30 pt-3">
            <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onDiscard}
                className="px-4 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Discard / Retake</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm sm:text-base font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all active:scale-[0.99]"
              >
                <Save className="w-5 h-5" />
                <span>Confirm &amp; Save to Records</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

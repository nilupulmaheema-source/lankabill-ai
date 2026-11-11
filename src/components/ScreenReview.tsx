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

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(
    (initialData.items || []).map((it, idx) => ({
      ...it,
      id: it.id || `item-${Date.now()}-${idx}`,
      unit: it.unit || 'nos',
    }))
  );

  // Mobile layout mode: 'split' | 'photo' | 'form'
  const [mobileView, setMobileView] = useState<'split' | 'photo' | 'form'>('split');
  const [isSaving, setIsSaving] = useState(false);

  // Arithmetic Integrity Check (Discriminated Union pattern)
  const integrity = useMemo(
    () => checkArithmeticIntegrity(items, grandTotalInput),
    [items, grandTotalInput]
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

        // Auto-recalculate line total if quantity or unit_price was modified
        if (field === 'quantity' || field === 'unit_price') {
          const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
          const price = field === 'unit_price' ? Number(value) || 0 : item.unit_price;
          updated.total = Math.round(qty * price * 100) / 100;
        }

        // Check row-level arithmetic integrity
        const lineExpected = Math.round(updated.quantity * updated.unit_price * 100) / 100;
        if (Math.abs(lineExpected - updated.total) > 1.0) {
          updated.isFlagged = true;
          updated.flagReason = `Diff: ${updated.quantity} × Rs. ${updated.unit_price} = Rs. ${lineExpected.toFixed(2)}`;
        } else {
          updated.isFlagged = false;
          updated.flagReason = undefined;
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
      quantity: 1,
      unit: 'nos',
      unit_price: 0,
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

  // Recalculate all row totals based on qty * unit_price
  const handleRecalculateAllRows = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        total: Math.round(it.quantity * it.unit_price * 100) / 100,
        isFlagged: false,
        flagReason: undefined,
      }))
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
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Itemized Line Items ({items.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            {/* Mobile Cards for < 640px / Responsive Table for >= 640px */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3 min-w-[180px]">Item Description</th>
                    <th className="py-2.5 px-2 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-2 w-20">Unit</th>
                    <th className="py-2.5 px-2 min-w-[110px] text-right">Unit Price (LKR)</th>
                    <th className="py-2.5 px-2 min-w-[120px] text-right">Total (LKR)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        item.isFlagged
                          ? 'bg-amber-950/30 hover:bg-amber-950/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id!, 'name', e.target.value)}
                          placeholder="Item name (සිමෙන්ති / Amox / Cable)"
                          className={`w-full bg-slate-950/80 border rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 ${
                            item.isFlagged ? 'border-amber-500/60 font-semibold' : 'border-slate-700'
                          }`}
                        />
                        {item.flagReason && (
                          <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                            ⚠️ {item.flagReason}
                          </span>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(item.id!, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1.5 text-center text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Unit */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.unit || 'nos'}
                          onChange={(e) => handleItemChange(item.id!, 'unit', e.target.value)}
                          placeholder="nos/pkt/cube"
                          className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1.5 text-center text-slate-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            handleItemChange(item.id!, 'unit_price', parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-slate-950/80 border border-slate-700 rounded px-2.5 py-1.5 text-right text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* Total */}
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.total}
                          onChange={(e) =>
                            handleItemChange(item.id!, 'total', parseFloat(e.target.value) || 0)
                          }
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
                    </tr>
                  ))}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
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

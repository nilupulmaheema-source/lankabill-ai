'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Split,
  Eye,
  FileEdit,
  Wand2,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
} from 'lucide-react';
import { PanZoomViewer } from './PanZoomViewer';
import {
  InvoiceExtraction,
  InvoiceItem,
  InvoiceCategory,
  InvoiceCategoryValues,
  InvoiceRecord,
  checkArithmeticIntegrity,
} from '@/types/invoice';
import { analyzePriceCreep, PriceCreepAnalysis } from '@/lib/priceRadar';

interface ScreenReviewProps {
  initialData: InvoiceExtraction;
  imageUrl: string;
  processingTimeMs: number;
  recordId?: string;
  onSave: (record: InvoiceRecord) => void;
  onDiscard: () => void;
}

export function ScreenReview({
  initialData,
  imageUrl,
  processingTimeMs,
  recordId,
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

  // Day 2 Magic Moment: Visual Grounding & Price Creep Radar state
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(items.length > 0 ? 0 : null);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceCreepAnalysis | null>(null);

  // Analyze price creep against previous store records
  useEffect(() => {
    let isMounted = true;
    analyzePriceCreep(items).then((analysis) => {
      if (isMounted) {
        setPriceAnalysis(analysis);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [items]);

  // Arithmetic Integrity Check (Discriminated Union pattern)
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
            const raw = Number(qty) * Number(price);
            let net = raw;

            if (discPct != null && Number(discPct) > 0) {
              net = raw * (1 - Number(discPct) / 100);
            } else if (discAmt != null && Number(discAmt) > 0) {
              net = raw - Number(discAmt);
            }

            updated.total = Math.round(net * 100) / 100;
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
    setActiveItemIndex(items.length);
  };

  // Delete row
  const handleDeleteRow = (id: string) => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      const next = prev.filter((item) => item.id !== id);
      if (activeItemIndex != null) {
        if (next.length === 0) {
          setActiveItemIndex(null);
        } else if (activeItemIndex >= next.length) {
          setActiveItemIndex(next.length - 1);
        }
      }
      return next;
    });
  };

  // Auto-Fix: Apply Calculated Total to Grand Total
  const handleAutoFixGrandTotal = () => {
    setGrandTotalInput(Math.round(calculatedTotal * 100) / 100);
  };

  // Recalculate all row totals based on qty * unit_price
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
      id: recordId || `inv-${Date.now()}`,
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5 animate-in fade-in duration-200">
      {/* Top Floating Glass Navigation Header */}
      <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] p-3.5 sm:p-4 rounded-3xl shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onDiscard}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title="Back to Capture"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Invoice Verification
              </h2>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                Ready for Review
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
              Compare AI extracted numbers against original receipt photo
            </p>
          </div>
        </div>

        {/* Mobile View Toggle Pills */}
        <div className="flex lg:hidden items-center bg-slate-200/60 dark:bg-zinc-800/80 p-0.5 rounded-full border border-black/[0.04] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setMobileView('photo')}
            className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all ios-pressable ${
              mobileView === 'photo'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('split')}
            className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all ios-pressable ${
              mobileView === 'split'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <Split className="w-3 h-3" />
            <span>Split</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView('form')}
            className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all ios-pressable ${
              mobileView === 'form'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400'
            }`}
          >
            <FileEdit className="w-3 h-3" />
            <span>Form</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>{(processingTimeMs / 1000).toFixed(2)}s scan time</span>
          </span>
        </div>
      </div>

      {/* CORE SPLIT SCREEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT / TOP: Interactive Pan-and-Zoom Bill Viewport */}
        <div
          className={`lg:col-span-5 h-[380px] lg:h-[720px] sticky top-20 ${
            mobileView === 'form' ? 'hidden lg:block' : 'block'
          }`}
        >
          <PanZoomViewer
            imageUrl={imageUrl}
            alt={vendorName || 'Supplier Bill'}
            items={items}
            activeItemIndex={activeItemIndex}
            onSelectItem={(idx) => setActiveItemIndex(idx)}
          />
        </div>

        {/* RIGHT / BOTTOM: Editable Form */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileView === 'photo' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* HEADER METADATA FIELDS (Apple Inset Grouped Style) */}
          <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-700 dark:text-zinc-300" />
                <span>Invoice Header Details</span>
              </h3>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-normal">Tap field to edit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Vendor Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Tokyo Cement, Western Pharma..."
                  className="w-full bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-medium transition-all"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Invoice / Chit No.
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="w-full bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono transition-all"
                />
              </div>

              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl px-3.5 py-2 text-sm text-slate-900 dark:text-white font-mono transition-all"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-zinc-400 mb-1">
                  Retail Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as InvoiceCategory)}
                  className="w-full bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 rounded-2xl px-3.5 py-2 text-sm text-slate-900 dark:text-white transition-all"
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

          {/* LANKA PRICE CREEP & INFLATION RADAR BANNER (Option 2 - Apple Health Insight Card Style) */}
          {priceAnalysis && (
            <div
              className={`p-4 sm:p-5 rounded-3xl border transition-all ios-glass ${
                priceAnalysis.increasedCount > 0
                  ? 'bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30 text-rose-900 dark:text-rose-200'
                  : priceAnalysis.decreasedCount > 0
                  ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  : 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/30 text-blue-900 dark:text-blue-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      priceAnalysis.increasedCount > 0
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : priceAnalysis.decreasedCount > 0
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {priceAnalysis.increasedCount > 0 ? (
                      <TrendingUp className="w-5 h-5 animate-pulse" />
                    ) : priceAnalysis.decreasedCount > 0 ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {priceAnalysis.increasedCount > 0
                          ? `⚠️ Price Increase Detected (${priceAnalysis.increasedCount} Item${
                              priceAnalysis.increasedCount > 1 ? 's' : ''
                            })`
                          : priceAnalysis.decreasedCount > 0
                          ? `📉 Supplier Discount / Price Drop (${priceAnalysis.decreasedCount} Item${
                              priceAnalysis.decreasedCount > 1 ? 's' : ''
                            })`
                          : priceAnalysis.analyzedItems.filter((i) => i.price_comparison?.status !== 'new').length > 0
                          ? 'Price Stability Verified: Zero Markups'
                          : 'Lanka Price Radar: Baseline Pricing Stored'}
                      </h4>
                      {priceAnalysis.increasedCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20 uppercase tracking-wide">
                          Supplier Markup
                        </span>
                      )}
                      {priceAnalysis.decreasedCount > 0 && priceAnalysis.increasedCount === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 uppercase tracking-wide">
                          Saved Money
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1 font-normal">
                      {priceAnalysis.increasedCount > 0 ? (
                        <>
                          Historical ledger comparison shows supplier increased prices. Cost impact:{' '}
                          <b className="font-mono text-rose-700 dark:text-rose-300 text-sm tabular-nums">
                            +Rs. {priceAnalysis.totalPriceHikeImpact.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </b>
                          {priceAnalysis.highestHikeItem && (
                            <span className="block sm:inline sm:ml-2 text-rose-600 dark:text-rose-400 text-[11px]">
                              ({priceAnalysis.highestHikeItem.name} +{priceAnalysis.highestHikeItem.diffPercentage}%)
                            </span>
                          )}
                        </>
                      ) : priceAnalysis.decreasedCount > 0 ? (
                        'Items are priced lower than previous purchases in your ledger.'
                      ) : priceAnalysis.analyzedItems.filter((i) => i.price_comparison?.status !== 'new').length > 0 ? (
                        'All items are billed at or below previous purchase levels in your ledger.'
                      ) : (
                        'New delivery recorded. Stored into ledger baseline to catch future supplier price hikes automatically.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-zinc-400 ios-glass px-3 py-1.5 rounded-full border border-black/[0.04] dark:border-white/[0.06] self-stretch sm:self-auto justify-between sm:justify-start">
                  <span>History Checked</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                    {priceAnalysis.analyzedItems.filter((i) => i.price_comparison?.status !== 'new').length} Matched
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ARITHMETIC INTEGRITY CHECK BANNER */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition-all ios-glass ${
              hasDiscrepancy
                ? 'bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    hasDiscrepancy
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {hasDiscrepancy ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {hasDiscrepancy
                      ? `Calculation Mismatch: Diff of Rs. ${discrepancy.toLocaleString('en-LK', {
                          minimumFractionDigits: 2,
                        })}`
                      : 'Arithmetic Verified (Zero Discrepancy)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-zinc-300 font-normal">
                    Line Sum: <b className="font-mono tabular-nums">Rs. {calculatedTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</b> | Bill Total: <b className="font-mono tabular-nums">Rs. {Number(grandTotalInput).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</b>
                  </p>
                </div>
              </div>

              {hasDiscrepancy && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAutoFixGrandTotal}
                    className="flex-1 sm:flex-initial text-xs font-semibold px-4 py-2 rounded-full bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5 ios-pressable"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Auto-Balance Total</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRecalculateAllRows}
                    className="flex-1 sm:flex-initial text-xs font-semibold px-3 py-2 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 transition-colors ios-pressable"
                    title="Recalculate row totals from Qty x Price"
                  >
                    Sync Lines
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* LINE ITEMS TABLE (Notion / Apple Numbers Clean Style) */}
          <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm">
            {/* Table Header Controls */}
            <div className="p-4 border-b border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
                  Line Items ({items.length})
                </h3>
                {category === 'Pharmacy' && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    Pharma Mode
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {category === 'Pharmacy' && (
                  <button
                    type="button"
                    onClick={() => handleApplyAllDiscount(8)}
                    className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 transition-colors ios-pressable"
                    title="Apply standard 8% Sri Lankan pharma distributor trade discount to all items"
                  >
                    <span>⚡ 8% Trade Disc</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-colors ios-pressable shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            {/* Seamless Borderless Inline Editable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-black/[0.04] dark:border-white/[0.06]">
                    {category === 'Pharmacy' ? (
                      <>
                        <th className="py-3 px-2 min-w-[85px] w-20">Code</th>
                        <th className="py-3 px-3 min-w-[170px]">Description</th>
                        <th className="py-3 px-2 min-w-[100px] w-24">Batch / Exp</th>
                        <th className="py-3 px-2 w-16 text-center">Billed Qty</th>
                        <th className="py-3 px-2 w-16 text-center text-teal-600 dark:text-teal-400">Bonus</th>
                        <th className="py-3 px-2 w-14 text-center">Unit</th>
                        <th className="py-3 px-2 min-w-[90px] text-right">Cost (Rs.)</th>
                        <th className="py-3 px-2 min-w-[85px] text-right">MRP (Rs.)</th>
                        <th className="py-3 px-2 w-14 text-right">Disc %</th>
                        <th className="py-3 px-2 min-w-[105px] text-right">Total (Rs.)</th>
                        <th className="py-3 px-2 w-8 text-center"></th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-3 min-w-[180px]">Description</th>
                        <th className="py-3 px-2 w-20 text-center">Qty</th>
                        <th className="py-3 px-2 w-20">Unit</th>
                        <th className="py-3 px-2 min-w-[110px] text-right">Unit Price (Rs.)</th>
                        <th className="py-3 px-2 min-w-[120px] text-right">Total (Rs.)</th>
                        <th className="py-3 px-2 w-10 text-center"></th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04] text-xs">
                  {items.map((item, idx) => {
                    const comparison = priceAnalysis?.analyzedItems[idx]?.price_comparison;
                    const isActive = activeItemIndex === idx;

                    return (
                      <tr
                        key={item.id || idx}
                        onClick={() => setActiveItemIndex(idx)}
                        className={`cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                            : item.isFlagged
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-zinc-200 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase transition-colors"
                              />
                            </td>

                            {/* Description */}
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(item.id!, 'name', e.target.value)}
                                placeholder="Panadol 500mg, Amox 250..."
                                className={`w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded-lg px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                                  item.isFlagged ? 'font-semibold text-amber-700 dark:text-amber-400' : ''
                                }`}
                              />
                              
                              {/* Visual Grounding & Price Creep Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1">
                                {item.bounding_box && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveItemIndex(idx);
                                    }}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ios-pressable ${
                                      isActive
                                        ? 'bg-emerald-500 text-white font-bold shadow-sm'
                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    }`}
                                    title="View on original bill photo"
                                  >
                                    <Target className="w-2.5 h-2.5" />
                                    <span>{isActive ? 'Pinned' : 'Locate'}</span>
                                  </button>
                                )}

                                {comparison?.status === 'increased' && (
                                  <span
                                    className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums"
                                    title={`Previous: Rs. ${comparison.previous_price.toLocaleString('en-LK')} on ${comparison.previous_date}`}
                                  >
                                    <TrendingUp className="w-3 h-3 text-rose-500" />
                                    <span>+{comparison.diff_percentage}% (+Rs. {comparison.diff_amount})</span>
                                  </span>
                                )}

                                {comparison?.status === 'decreased' && (
                                  <span
                                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums"
                                    title={`Previous: Rs. ${comparison.previous_price.toLocaleString('en-LK')} on ${comparison.previous_date}`}
                                  >
                                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                                    <span>{comparison.diff_percentage}% (-Rs. {Math.abs(comparison.diff_amount)})</span>
                                  </span>
                                )}

                                {comparison?.status === 'new' && (
                                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                                    New SKU
                                  </span>
                                )}
                              </div>

                              {item.is_illegible && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium px-1">
                                  ⚠️ Torn or illegible field detected
                                </span>
                              )}
                              {item.flagReason && !item.is_illegible && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium px-1">
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
                                  placeholder="Batch"
                                  className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                                <input
                                  type="text"
                                  value={item.expiry_date || ''}
                                  onChange={(e) => handleItemChange(item.id!, 'expiry_date', e.target.value)}
                                  placeholder="MM/YY"
                                  className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-0.5 text-[11px] text-slate-500 dark:text-zinc-400 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1 py-1 text-center text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1 py-1 text-center text-teal-700 dark:text-teal-400 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-teal-500"
                                title="Free Issue / Bonus stock (F.O.C.)"
                              />
                            </td>

                            {/* Unit */}
                            <td className="p-2 text-center">
                              <input
                                type="text"
                                value={item.unit || 'box'}
                                onChange={(e) => handleItemChange(item.id!, 'unit', e.target.value)}
                                placeholder="box"
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1 py-1 text-center text-slate-600 dark:text-zinc-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* Wholesale Unit Price */}
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-1 text-right text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-1 text-right text-slate-500 dark:text-zinc-400 font-mono text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1 py-1 text-right text-teal-700 dark:text-teal-400 font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className={`w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-1 text-right font-mono font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                  item.isFlagged
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              />
                            </td>

                            {/* Action Delete */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(item.id!)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                                className={`w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded-lg px-2 py-1 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors ${
                                  item.isFlagged ? 'font-semibold text-amber-600 dark:text-amber-400' : ''
                                }`}
                              />
                              
                              {/* Visual Grounding & Price Creep Badges */}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 px-1">
                                {item.bounding_box && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveItemIndex(idx);
                                    }}
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ios-pressable ${
                                      isActive
                                        ? 'bg-emerald-500 text-white font-bold shadow-sm'
                                        : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    }`}
                                    title="View on original bill photo"
                                  >
                                    <Target className="w-2.5 h-2.5" />
                                    <span>{isActive ? 'Pinned' : 'Locate'}</span>
                                  </button>
                                )}

                                {comparison?.status === 'increased' && (
                                  <span
                                    className="text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums"
                                    title={`Was Rs. ${comparison.previous_price.toLocaleString('en-LK')} on ${comparison.previous_date}`}
                                  >
                                    <TrendingUp className="w-3 h-3 text-rose-500" />
                                    <span>+{comparison.diff_percentage}% (+Rs. {comparison.diff_amount})</span>
                                  </span>
                                )}

                                {comparison?.status === 'decreased' && (
                                  <span
                                    className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 tabular-nums"
                                    title={`Was Rs. ${comparison.previous_price.toLocaleString('en-LK')} on ${comparison.previous_date}`}
                                  >
                                    <TrendingDown className="w-3 h-3 text-emerald-500" />
                                    <span>{comparison.diff_percentage}% (-Rs. {Math.abs(comparison.diff_amount)})</span>
                                  </span>
                                )}

                                {comparison?.status === 'new' && (
                                  <span className="text-[10px] text-blue-700 dark:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                                    New SKU
                                  </span>
                                )}
                              </div>

                              {item.is_illegible && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium px-1">
                                  ⚠️ Torn or illegible field detected on bill
                                </span>
                              )}
                              {item.flagReason && !item.is_illegible && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-medium px-1">
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1 py-1 text-center text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>

                            {/* Standard Unit */}
                            <td className="p-2 text-center">
                              <input
                                type="text"
                                value={item.unit || 'nos'}
                                onChange={(e) => handleItemChange(item.id!, 'unit', e.target.value)}
                                placeholder="nos"
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1 py-1 text-center text-slate-600 dark:text-zinc-400 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className="w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-1 text-right text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                className={`w-full bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05] focus:bg-white dark:focus:bg-zinc-800 rounded px-1.5 py-1 text-right font-mono font-bold tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                                  item.isFlagged
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              />
                            </td>

                            {/* Action Delete */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(item.id!)}
                                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}

                  {items.length === 0 && (
                    <tr>
                      <td colSpan={category === 'Pharmacy' ? 11 : 6} className="text-center py-8 text-slate-400 dark:text-zinc-500 text-xs">
                        No line items found. Click &quot;Add Row&quot; to enter items manually.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Summary Footer */}
            <div className="p-4 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Item
              </button>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Calculated Total</span>
                  <span className="font-mono text-sm font-bold text-slate-800 dark:text-zinc-200 tabular-nums">
                    Rs. {calculatedTotal.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="pl-4 border-l border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">Bill Grand Total (LKR)</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-400">Rs.</span>
                    <input
                      type="number"
                      step="0.01"
                      value={grandTotalInput}
                      onChange={(e) => setGrandTotalInput(parseFloat(e.target.value) || 0)}
                      className={`w-36 bg-slate-100 dark:bg-zinc-800 border rounded-xl px-3 py-1 text-right text-base font-bold font-mono tabular-nums focus:outline-none focus:ring-2 ${
                        hasDiscrepancy
                          ? 'border-amber-500 text-amber-700 dark:text-amber-300 focus:ring-amber-500'
                          : 'border-emerald-500 text-emerald-700 dark:text-emerald-300 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Notes */}
          {initialData.confidence_notes && (
            <div className="p-3.5 ios-glass rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-xs text-slate-500 dark:text-zinc-400 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Gemini Flash AI Notes:</span>{' '}
                {initialData.confidence_notes}
              </p>
            </div>
          )}

          {/* BOTTOM FLOATING ACTION DOCK */}
          <div className="sticky bottom-4 z-30 pt-3">
            <div className="ios-glass border border-black/[0.08] dark:border-white/[0.12] p-2.5 rounded-full shadow-2xl flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onDiscard}
                className="px-5 py-2.5 rounded-full text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors ios-pressable"
              >
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Discard</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-7 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all ios-pressable"
              >
                <Save className="w-4 h-4" />
                <span>Approve &amp; Save Record</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

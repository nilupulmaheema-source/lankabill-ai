'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  FileSpreadsheet,
  Trash2,
  Building,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  InvoiceRecord,
  InvoiceCategoryValues,
  CATEGORY_CONFIG,
} from '@/types/invoice';
import {
  exportInvoicesToCsv,
  generateGoogleSheetsTsv,
  deleteInvoiceRecord,
} from '@/lib/supabase';

interface ScreenLedgerProps {
  invoices: InvoiceRecord[];
  onRefresh: () => void;
  onSelectForEdit?: (record: InvoiceRecord) => void;
}

export function ScreenLedger({ invoices, onRefresh, onSelectForEdit }: ScreenLedgerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [activeModalRecord, setActiveModalRecord] = useState<InvoiceRecord | null>(null);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search by vendor name, invoice number, or item name
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        inv.vendor_name.toLowerCase().includes(query) ||
        inv.invoice_number.toLowerCase().includes(query) ||
        (inv.items && inv.items.some((it) => it.name.toLowerCase().includes(query)));

      // Filter by category
      const matchesCategory =
        selectedCategory === 'All' || inv.category === selectedCategory;

      // Filter by status
      const matchesStatus =
        selectedStatus === 'All' || inv.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [invoices, searchTerm, selectedCategory, selectedStatus]);

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalSpend = invoices.reduce((acc, curr) => acc + (curr.grand_total || 0), 0);
    const flaggedCount = invoices.filter((i) => i.status === 'Flagged' || i.discrepancy > 1).length;
    const avgTime =
      invoices.length > 0
        ? Math.round(
            invoices.reduce((acc, curr) => acc + (curr.processing_time_ms || 2800), 0) /
              invoices.length
          )
        : 0;

    return { totalSpend, flaggedCount, avgTime };
  }, [invoices]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this invoice record from the ledger?')) {
      await deleteInvoiceRecord(id);
      onRefresh();
      if (activeModalRecord?.id === id) {
        setActiveModalRecord(null);
      }
    }
  };

  const handleCopyGoogleSheetsTsv = () => {
    const tsv = generateGoogleSheetsTsv(filteredInvoices);
    navigator.clipboard.writeText(tsv);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  const handleCopySingleInvoiceTsv = (record: InvoiceRecord) => {
    const header = ['Item Description', 'Quantity', 'Unit', 'Unit Price (LKR)', 'Line Total (LKR)'].join('\t');
    const rows = (record.items || []).map((it) =>
      [it.name, it.quantity ?? '', it.unit || 'nos', it.unit_price ?? '', it.total ?? ''].join('\t')
    );
    const tsv = [
      `Invoice: ${record.vendor_name} (#${record.invoice_number})`,
      `Date: ${record.invoice_date}`,
      `Grand Total: Rs. ${record.grand_total}`,
      '',
      header,
      ...rows,
    ].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* APPLE FITNESS / HEALTH STYLE KPI BENTO CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invoices */}
        <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">Total Recorded</span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {invoices.length}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">All categories</span>
        </div>

        {/* Total Value */}
        <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">Total Spend (LKR)</span>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums tracking-tight">
            Rs. {stats.totalSpend.toLocaleString('en-LK', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">Sum of bills</span>
        </div>

        {/* Flagged Invoices */}
        <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">Discrepancies</span>
          <p
            className={`text-2xl sm:text-3xl font-bold tabular-nums tracking-tight ${
              stats.flaggedCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {stats.flaggedCount}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
            {stats.flaggedCount > 0 ? 'Require cashier audit' : 'Zero math slips'}
          </span>
        </div>

        {/* Average Processing Time */}
        <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] p-5 rounded-3xl shadow-sm space-y-1">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium block">Gemini Flash Speed</span>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums tracking-tight">
            {stats.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : '< 3.5s'}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">OCR &amp; schema parsing</span>
        </div>
      </div>

      {/* APPLE SEARCH & SEGMENTED FILTER CONTROL BAR */}
      <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] p-4 sm:p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Spotlight Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vendor, invoice no., or item (e.g. සිමෙන්ති, Panadol)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-zinc-800/80 border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 rounded-full pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 transition-all focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportInvoicesToCsv(filteredInvoices)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-colors ios-pressable shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSheetsModal(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm ios-pressable"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sync to Sheets</span>
            </button>
          </div>
        </div>

        {/* Category & Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium mr-1">Category:</span>
          {['All', ...InvoiceCategoryValues].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ios-pressable ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium ml-3 mr-1">Status:</span>
          {['All', 'Approved', 'Flagged', 'Pending Verification'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ios-pressable ${
                selectedStatus === st
                  ? 'bg-slate-900 dark:bg-zinc-200 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* INVOICES TABLE (Apple Grouped Inset Style) */}
      <div className="ios-glass border border-black/[0.06] dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-sm">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center mx-auto">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">No Invoice Records Found</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto font-normal">
              {searchTerm || selectedCategory !== 'All'
                ? 'Try adjusting your search query or filters.'
                : 'Scan your first supplier bill or choose a benchmark sample to start building your ledger.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider border-b border-black/[0.04] dark:border-white/[0.06]">
                  <th className="py-3 px-4">Vendor &amp; Invoice No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total (LKR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04] text-xs">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setActiveModalRecord(inv)}
                    className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    {/* Vendor & Invoice Number */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {inv.vendor_name || 'Unknown Vendor'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                        #{inv.invoice_number || 'N/A'}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-slate-600 dark:text-zinc-400 font-mono text-xs">
                      {inv.invoice_date || 'N/A'}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          CATEGORY_CONFIG[inv.category]?.badgeClass || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {inv.category}
                      </span>
                    </td>

                    {/* Items count */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-mono text-slate-600 dark:text-zinc-400 tabular-nums">
                        {inv.items?.length || 0}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      Rs. {inv.grand_total?.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                            : inv.status === 'Flagged'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectForEdit && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectForEdit(inv);
                            }}
                            className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 font-semibold"
                          >
                            Inspect
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(inv.id, e)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL (Apple Sheet Style) */}
      {activeModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="ios-glass border border-black/[0.08] dark:border-white/[0.12] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {activeModalRecord.vendor_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                  Invoice #{activeModalRecord.invoice_number} • {activeModalRecord.invoice_date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRecord(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bill Scan Preview if available */}
            {activeModalRecord.image_url && (
              <div className="p-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] flex flex-col items-center">
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mb-2 self-start">
                  Original Bill Photo:
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeModalRecord.image_url}
                  alt="Original Bill"
                  className="max-h-56 object-contain rounded-xl shadow-sm"
                />
              </div>
            )}

            {/* Status & Arithmetic check */}
            <div
              className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                activeModalRecord.status === 'Approved'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div>
                <span className="font-bold block">
                  Status: {activeModalRecord.status}
                </span>
                <span>
                  Calculated Line Sum: Rs. {activeModalRecord.calculated_total?.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base font-bold tabular-nums">
                  Grand Total: Rs. {activeModalRecord.grand_total?.toFixed(2)}
                </span>
                {activeModalRecord.discrepancy > 0 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-mono">
                    Difference: Rs. {activeModalRecord.discrepancy.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="border border-black/[0.06] dark:border-white/[0.08] rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 border-b border-black/[0.04] dark:border-white/[0.06] text-[11px]">
                  <tr>
                    <th className="p-2.5 text-left">Item Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price (Rs.)</th>
                    <th className="p-2.5 text-right">Total (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03] dark:divide-white/[0.04]">
                  {activeModalRecord.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                      <td className="p-2.5 text-slate-900 dark:text-white font-medium">{it.name}</td>
                      <td className="p-2.5 text-center font-mono text-slate-600 dark:text-zinc-400 tabular-nums">
                        {it.quantity != null ? `${it.quantity} ${it.unit || 'nos'}` : <span className="text-amber-500 italic">Torn/Null</span>}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-600 dark:text-zinc-400 tabular-nums">
                        {it.unit_price != null ? it.unit_price.toFixed(2) : '-'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                        {it.total != null ? it.total.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Confidence Notes */}
            {activeModalRecord.confidence_notes && (
              <div className="text-xs text-slate-500 dark:text-zinc-400 p-3 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-black/[0.04] dark:border-white/[0.06]">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">Notes: </span>
                {activeModalRecord.confidence_notes}
              </div>
            )}

            {/* Modal Footer with 1-Click Google Sheets Export & Edit */}
            <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Logged: {new Date(activeModalRecord.created_at).toLocaleString('en-LK')}
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => handleCopySingleInvoiceTsv(activeModalRecord)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 transition-all ios-pressable"
                >
                  {copiedTsv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTsv ? 'Copied TSV!' : 'Copy for Google Sheets'}</span>
                </button>
                {onSelectForEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectForEdit(activeModalRecord);
                      setActiveModalRecord(null);
                    }}
                    className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-slate-200/80 dark:bg-zinc-700 text-slate-800 dark:text-zinc-200 hover:opacity-90 transition-all ios-pressable"
                  >
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveModalRecord(null)}
                  className="px-4 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full transition-opacity hover:opacity-90 ios-pressable"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SYNC TO GOOGLE SHEETS MODAL */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="ios-glass border border-black/[0.08] dark:border-white/[0.12] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Sync to Google Sheets</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Copy tab-delimited ledger data and paste directly into Google Spreadsheets with all Sinhala Unicode and prices preserved.
            </p>

            <div className="p-3 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-black/[0.04] dark:border-white/[0.06] text-[11px] font-mono text-emerald-700 dark:text-emerald-400 max-h-40 overflow-y-auto whitespace-pre">
              {generateGoogleSheetsTsv(filteredInvoices)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                Open Blank Sheet <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSheetsModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCopyGoogleSheetsTsv}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors shadow-sm ios-pressable"
                >
                  {copiedTsv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedTsv ? 'Copied!' : 'Copy Sheets Data'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

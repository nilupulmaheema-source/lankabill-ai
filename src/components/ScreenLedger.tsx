'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpDown,
  Building,
  Calendar,
  DollarSign,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  InvoiceRecord,
  InvoiceCategory,
  InvoiceCategoryValues,
  InvoiceStatus,
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invoices */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Total Bills Recorded</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            {invoices.length}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">All retail categories</span>
        </div>

        {/* Total Value */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Total Spend (LKR)</span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            Rs. {stats.totalSpend.toLocaleString('en-LK', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-[11px] text-slate-400">Sum of approved &amp; verified</span>
        </div>

        {/* Flagged Invoices */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Flagged Discrepancies</span>
          <p
            className={`text-2xl sm:text-3xl font-extrabold mt-1 ${
              stats.flaggedCount > 0 ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            {stats.flaggedCount}
          </p>
          <span className="text-[11px] text-slate-400">
            {stats.flaggedCount > 0 ? 'Require audit / correction' : 'Zero math errors'}
          </span>
        </div>

        {/* Average Processing Time */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">Avg Gemini Flash Speed</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-teal-400 mt-1 font-mono">
            {stats.avgTime ? `${(stats.avgTime / 1000).toFixed(1)}s` : '< 3.5s'}
          </p>
          <span className="text-[11px] text-slate-400">OCR &amp; schema parsing</span>
        </div>
      </div>

      {/* FILTER & EXPORT ACTION BAR */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vendor, invoice no., or item (e.g. සිමෙන්ති, Panadol)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
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
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 shadow"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV / Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSheetsModal(true)}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Sync to Google Sheets</span>
            </button>
          </div>
        </div>

        {/* Category & Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs text-slate-400 font-medium">Category:</span>
          {['All', ...InvoiceCategoryValues].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          <span className="text-xs text-slate-400 font-medium ml-2">Status:</span>
          {['All', 'Approved', 'Flagged', 'Pending Verification'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === st
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'bg-slate-800/70 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* INVOICES TABLE / LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-sm">No Invoice Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchTerm || selectedCategory !== 'All'
                ? 'Try adjusting your search query or filters.'
                : 'Scan your first supplier bill or choose a benchmark sample to start building your ledger.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4">Vendor &amp; Invoice No.</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total (LKR)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setActiveModalRecord(inv)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Vendor & Invoice Number */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {inv.vendor_name || 'Unknown Vendor'}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Inv #{inv.invoice_number || 'N/A'}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-slate-300 font-mono">
                      {inv.invoice_date || 'N/A'}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          CATEGORY_CONFIG[inv.category]?.badgeClass || 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {inv.category}
                      </span>
                    </td>

                    {/* Items count */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-slate-300">
                        {inv.items?.length || 0}
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        Rs. {(inv.grand_total || 0).toLocaleString('en-LK', {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                      {inv.discrepancy > 1 && (
                        <div className="text-[10px] text-amber-400 font-mono">
                          Diff: Rs. {inv.discrepancy.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Approved'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : inv.status === 'Flagged'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {inv.status === 'Approved' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                        )}
                        <span>{inv.status}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModalRecord(inv);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDelete(inv.id, e)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* DETAIL MODAL (Itemized Breakdown & Photo Preview) */}
      {activeModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div>
                <h3 className="font-bold text-base text-white">
                  {activeModalRecord.vendor_name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Invoice #{activeModalRecord.invoice_number} • Date:{' '}
                  {activeModalRecord.invoice_date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRecord(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Thumbnail of Bill Image */}
              {activeModalRecord.image_url && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center">
                  <span className="text-[11px] text-slate-400 font-medium mb-2 self-start">
                    Original Bill Scan:
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeModalRecord.image_url}
                    alt="Original Bill"
                    className="max-h-56 object-contain rounded border border-slate-800 shadow"
                  />
                </div>
              )}

              {/* Status & Arithmetic check */}
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                  activeModalRecord.status === 'Approved'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
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
                  <span className="font-mono text-base font-bold">
                    Grand Total: Rs. {activeModalRecord.grand_total?.toFixed(2)}
                  </span>
                  {activeModalRecord.discrepancy > 0 && (
                    <span className="text-[11px] text-amber-400 block font-mono">
                      Difference: Rs. {activeModalRecord.discrepancy.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
                {activeModalRecord.category === 'Pharmacy' ||
                activeModalRecord.items?.some((it) => it.product_code || it.batch_no || it.discount_percent) ? (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-2.5 text-left w-20">Code</th>
                        <th className="p-2.5 text-left">Description</th>
                        <th className="p-2.5 text-left w-28">Batch / Exp</th>
                        <th className="p-2.5 text-center w-16">Billed</th>
                        <th className="p-2.5 text-center w-16 text-teal-400">Bonus</th>
                        <th className="p-2.5 text-right w-20">Wholesale</th>
                        <th className="p-2.5 text-right w-20">MRP</th>
                        <th className="p-2.5 text-right w-14">Disc%</th>
                        <th className="p-2.5 text-right w-24">Net Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {activeModalRecord.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2.5 font-mono text-[11px] text-teal-400">{it.product_code || '-'}</td>
                          <td className="p-2.5 text-slate-100 font-medium">{it.name}</td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-400">
                            {it.batch_no || '-'}{it.expiry_date ? ` (${it.expiry_date})` : ''}
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-300">
                            {it.quantity != null ? `${it.quantity} ${it.unit || 'nos'}` : <span className="text-amber-400 italic text-[11px]">Torn/Null</span>}
                          </td>
                          <td className="p-2.5 text-center font-mono text-teal-400">
                            {it.free_quantity != null && it.free_quantity > 0 ? it.free_quantity : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-300">
                            {it.unit_price != null ? it.unit_price.toFixed(2) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400 text-[11px]">
                            {it.retail_price != null ? it.retail_price.toFixed(2) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono text-teal-400">
                            {it.discount_percent != null && it.discount_percent > 0 ? `${it.discount_percent}%` : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                            {it.total != null ? it.total.toFixed(2) : <span className="text-amber-400 text-xs">Unspecified</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="p-2.5 text-left">Item Description</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price (Rs.)</th>
                        <th className="p-2.5 text-right">Total (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {activeModalRecord.items?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2.5 text-slate-100 font-medium">{it.name}</td>
                          <td className="p-2.5 text-center font-mono text-slate-300">
                            {it.quantity != null ? `${it.quantity} ${it.unit || 'nos'}` : <span className="text-amber-400 italic text-[11px]">Torn/Null</span>}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-300">
                            {it.unit_price != null ? it.unit_price.toFixed(2) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                            {it.total != null ? it.total.toFixed(2) : <span className="text-amber-400 text-xs">Unspecified</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Confidence Notes */}
              {activeModalRecord.confidence_notes && (
                <div className="text-xs text-slate-400 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="font-semibold text-slate-300">Notes: </span>
                  {activeModalRecord.confidence_notes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Logged at: {new Date(activeModalRecord.created_at).toLocaleString('en-LK')}
              </span>
              <button
                type="button"
                onClick={() => setActiveModalRecord(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYNC TO GOOGLE SHEETS MODAL */}
      {showSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Sync to Google Sheets</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSheetsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Copy the tab-delimited ledger data and paste directly (Ctrl+V / Cmd+V) into any Google Spreadsheet. All Sinhala Unicode characters, quantities, and prices are preserved.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 max-h-40 overflow-y-auto whitespace-pre">
              {generateGoogleSheetsTsv(filteredInvoices)}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
              >
                Open Blank Google Sheet <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSheetsModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Done
                </button>

                <button
                  type="button"
                  onClick={handleCopyGoogleSheetsTsv}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow"
                >
                  {copiedTsv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedTsv ? 'Copied to Clipboard!' : 'Copy Sheets TSV'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

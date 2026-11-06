'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ScreenCapture } from '@/components/ScreenCapture';
import { ScreenReview } from '@/components/ScreenReview';
import { ScreenLedger } from '@/components/ScreenLedger';
import { SettingsModal } from '@/components/SettingsModal';
import {
  InvoiceExtraction,
  InvoiceRecord,
} from '@/types/invoice';
import {
  getInvoiceRecords,
  saveInvoiceRecord,
  getSupabaseClient,
  getUserSettings,
} from '@/lib/supabase';
import { SAMPLE_BILLS } from '@/data/sampleBills';
import { CheckCircle2 } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'capture' | 'review' | 'ledger'>('capture');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Review state
  const [reviewData, setReviewData] = useState<{
    extraction: InvoiceExtraction;
    imageUrl: string;
    processingTimeMs: number;
  } | null>(null);

  // Ledger state
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data and check Supabase connectivity
  const refreshRecords = async () => {
    const list = await getInvoiceRecords();
    
    // Seed initial records if empty so the user can immediately explore the ledger
    if (list.length === 0) {
      const seeded: InvoiceRecord[] = SAMPLE_BILLS.map((sb, idx) => ({
        id: `seed-${idx + 1}`,
        vendor_name: sb.data.vendor_name || 'Vendor',
        invoice_number: sb.data.invoice_number || 'N/A',
        invoice_date: sb.data.invoice_date || '2026-11-05',
        category: sb.data.category,
        items: sb.data.items,
        grand_total: sb.data.grand_total,
        calculated_total: sb.data.items.reduce((s, it) => s + it.total, 0),
        discrepancy: sb.hasDiscrepancy ? 1500.00 : 0,
        status: sb.hasDiscrepancy ? 'Flagged' : 'Approved',
        confidence_notes: sb.data.confidence_notes,
        image_url: sb.imageUrl,
        created_at: new Date(Date.now() - idx * 86400000).toISOString(),
        processing_time_ms: 2200 + idx * 400,
        sync_status: 'local_only',
      }));

      for (const rec of seeded) {
        await saveInvoiceRecord(rec);
      }
      setInvoices(seeded);
    } else {
      setInvoices(list);
    }

    const client = getSupabaseClient();
    setIsSupabaseConnected(Boolean(client));
  };

  useEffect(() => {
    refreshRecords();

    // Register PWA Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('SW registration note:', err));
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Callback when Gemini extraction completes
  const handleExtractionComplete = (result: {
    extraction: InvoiceExtraction;
    imageUrl: string;
    processingTimeMs: number;
  }) => {
    setReviewData(result);
    setActiveTab('review');
  };

  // Callback when review is confirmed & saved
  const handleSaveInvoice = async (record: InvoiceRecord) => {
    const res = await saveInvoiceRecord(record);
    await refreshRecords();
    setReviewData(null);
    setActiveTab('ledger');
    triggerToast(
      res.sync === 'synced'
        ? `Invoice saved and synced to Supabase (Rs. ${record.grand_total.toLocaleString('en-LK')})`
        : `Invoice saved to local ledger (Rs. ${record.grand_total.toLocaleString('en-LK')})`
    );
  };

  // Callback when user discards review
  const handleDiscardReview = () => {
    setReviewData(null);
    setActiveTab('capture');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (typeof document !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border border-emerald-400/40">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main App Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSettings={() => setIsSettingsOpen(true)}
        recordCount={invoices.length}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* App Body Content */}
      <main className="flex-1 pb-12">
        {activeTab === 'capture' && (
          <ScreenCapture onExtractionComplete={handleExtractionComplete} />
        )}

        {activeTab === 'review' && reviewData && (
          <ScreenReview
            initialData={reviewData.extraction}
            imageUrl={reviewData.imageUrl}
            processingTimeMs={reviewData.processingTimeMs}
            onSave={handleSaveInvoice}
            onDiscard={handleDiscardReview}
          />
        )}

        {activeTab === 'ledger' && (
          <ScreenLedger
            invoices={invoices}
            onRefresh={refreshRecords}
            onSelectForEdit={(rec) => {
              setReviewData({
                extraction: {
                  vendor_name: rec.vendor_name,
                  invoice_number: rec.invoice_number,
                  invoice_date: rec.invoice_date,
                  category: rec.category,
                  items: rec.items,
                  grand_total: rec.grand_total,
                  confidence_notes: rec.confidence_notes,
                },
                imageUrl: rec.image_url || '',
                processingTimeMs: rec.processing_time_ms || 2000,
              });
              setActiveTab('review');
            }}
          />
        )}
      </main>

      {/* Configuration & Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={() => {
          refreshRecords();
          triggerToast('Settings updated successfully.');
        }}
      />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Database, Check, Copy, Shield, Info, Sparkles } from 'lucide-react';
import { getUserSettings, saveUserSettings, UserSettings } from '@/lib/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}

export function SettingsModal({ isOpen, onClose, onSettingsSaved }: SettingsModalProps) {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [shopName, setShopName] = useState('My Retail Store');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'keys' | 'sql'>('keys');

  useEffect(() => {
    if (isOpen) {
      const current = getUserSettings();
      setGeminiApiKey(current.geminiApiKey || '');
      setSupabaseUrl(current.supabaseUrl || '');
      setSupabaseAnonKey(current.supabaseAnonKey || '');
      setShopName(current.shopName || 'Lanka Retail & Hardware');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      geminiApiKey: geminiApiKey.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      shopName: shopName.trim() || 'Lanka Retail Store',
    };
    saveUserSettings(updated);
    setSavedSuccess(true);
    if (onSettingsSaved) onSettingsSaved();
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const copySqlToClipboard = () => {
    const sql = `-- Supabase Database Schema for LankaBill Scanner PWA
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(255) NOT NULL DEFAULT 'Unknown Vendor',
    invoice_number VARCHAR(100) NOT NULL DEFAULT 'N/A',
    invoice_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(50) DEFAULT 'General' CHECK (category IN ('Pharmacy', 'Hardware', 'General', 'Utilities')),
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    calculated_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discrepancy NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending Verification' CHECK (status IN ('Pending Verification', 'Approved', 'Flagged')),
    confidence_notes TEXT,
    image_url TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(30) DEFAULT 'nos',
    unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'Shop Counter Staff',
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE invoices;`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">System &amp; API Configuration</h3>
              <p className="text-xs text-slate-400">Gemini 2.5 Flash Vision &amp; Supabase Cloud Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'keys'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            API Keys &amp; Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Supabase SQL Setup
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'keys' ? (
            <form id="settings-form" onSubmit={handleSave} className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  Keys are securely stored in your browser storage. If not set, the app runs in{' '}
                  <span className="text-emerald-300 font-semibold">Simulated Benchmark Mode</span> with realistic Sri Lankan hardware &amp; pharmacy bill intelligence.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Google Gemini API Key (Gemini Flash Vision)
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Get your free Gemini Flash API key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline hover:text-emerald-300"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank to use the built-in offline-first LocalStorage database.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Store / Business Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Care Pharmacy / Nawala Hardware"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Run this in Supabase SQL Editor:
                </span>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors shadow"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied to Clipboard!' : 'Copy Schema SQL'}
                </button>
              </div>

              <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-[300px]">
{`-- 1. Create Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    category VARCHAR(50) DEFAULT 'General',
    grand_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    calculated_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    discrepancy NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending Verification',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Line Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(30) DEFAULT 'nos',
    unit_price NUMERIC(12, 2) NOT NULL,
    total NUMERIC(14, 2) NOT NULL
);

-- 3. Enable Real-Time
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Local &amp; End-to-End Encrypted</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            {activeTab === 'keys' && (
              <button
                type="submit"
                form="settings-form"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-950/50"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" /> Saved!
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

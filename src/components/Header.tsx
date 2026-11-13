'use client';

import React from 'react';
import { Camera, BookOpen, Settings, Zap, Database, Sun, Moon, Cloud, HardDrive } from 'lucide-react';

interface HeaderProps {
  activeTab: 'capture' | 'review' | 'ledger';
  setActiveTab: (tab: 'capture' | 'review' | 'ledger') => void;
  isSupabaseConnected: boolean;
  onOpenSettings: () => void;
  recordCount: number;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  isSupabaseConnected,
  onOpenSettings,
  recordCount,
  darkMode,
  toggleDarkMode,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('capture')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  LankaBill
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Flash 3.5
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                High-Speed Invoice &amp; Receipt AI
              </p>
            </div>
          </div>
        </div>

        {/* Center Navigation Bar */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'capture'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Bill</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
              activeTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Ledger</span>
            {recordCount > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-800 text-emerald-400 border border-slate-700 rounded-full text-[10px] font-mono font-bold">
                {recordCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          {/* Sync Status Badge */}
          <div
            onClick={onOpenSettings}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
              isSupabaseConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300 hover:bg-amber-900/40'
            }`}
            title={isSupabaseConnected ? 'Connected to Supabase PostgreSQL' : 'Offline / Local Database'}
          >
            {isSupabaseConnected ? (
              <>
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Supabase Sync</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 text-amber-400" />
                <span>Local DB</span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Configure Gemini & Supabase Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

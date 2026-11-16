'use client';

import React from 'react';
import { Camera, BookOpen, Clock, Settings, Zap, Database, Sun, Moon, HardDrive } from 'lucide-react';

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
    <header className="sticky top-0 z-40 w-full ios-glass border-b border-black/[0.06] dark:border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Logo & Name (Apple Squircle & San Francisco Typography) */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab('capture')}
            className="flex items-center gap-2.5 cursor-pointer group ios-pressable"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30 group-hover:opacity-95 transition-opacity">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                  LankaBill
                </span>
                <span className="text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-400/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal hidden sm:block">
                Sri Lankan Invoice Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center iOS Segmented Switch Control */}
        <nav className="flex items-center p-1 rounded-full bg-slate-200/60 dark:bg-zinc-800/80 border border-black/[0.04] dark:border-white/[0.06] shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ios-pressable ${
              activeTab === 'capture'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ios-pressable relative ${
              activeTab === 'ledger'
                ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Recents</span>
            {recordCount > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-300/80 dark:bg-zinc-600 text-slate-700 dark:text-zinc-200 rounded-full text-[10px] tabular-nums font-semibold">
                {recordCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Status & Tools */}
        <div className="flex items-center gap-2">
          {/* Sync Status Pill */}
          <div
            onClick={onOpenSettings}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-opacity hover:opacity-80 ${
              isSupabaseConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}
            title={isSupabaseConnected ? 'Connected to Supabase PostgreSQL' : 'Local Storage Mode'}
          >
            {isSupabaseConnected ? (
              <>
                <Database className="w-3 h-3 text-emerald-500" />
                <span>Cloud Sync</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3 h-3 text-amber-500" />
                <span>Local</span>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors ios-pressable"
            title="Configure API Keys & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

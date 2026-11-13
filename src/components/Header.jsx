import React, { useState } from 'react';
import {
  AlertTriangle,
  BarChart2,
  Download,
  Eye,
  Home,
  Landmark,
  LayoutGrid,
  LogOut,
  Map as MapIcon,
  Plus,
  Printer,
  RotateCcw,
  Shield,
} from 'lucide-react';
import { tr } from '../i18n/translations';

export function Header({
  activeView,
  onChangeView,
  lang,
  onChangeLang,
  user,
  isAdmin,
  isResetting,
  hasRealOsmData,
  openComplaintsCount,
  onOpenAddModal,
  onExportJson,
  onResetData,
  onLogout,
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    onResetData();
  };

  const navItems = [
    { key: 'home', labelKey: 'navHome', icon: Home },
    { key: 'map', labelKey: 'navMap', icon: MapIcon },
    { key: 'dashboard', labelKey: 'navDashboard', icon: BarChart2 },
    {
      key: 'complaints',
      labelKey: 'navComplaints',
      icon: AlertTriangle,
      badge: openComplaintsCount,
    },
    { key: 'wards', labelKey: 'navWards', icon: LayoutGrid },
    { key: 'register', labelKey: 'navPrint', icon: Printer },
  ];

  return (
    <header className="bg-white border-b border-slate-200 border-t-4 border-t-emerald-700 px-3 sm:px-4 lg:px-6 py-2.5 shrink-0 z-30 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & Title (clicks to Home) */}
        <button
          type="button"
          onClick={() => onChangeView('home')}
          className="flex items-center gap-2.5 min-w-0 text-left group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-sky-800 text-white flex items-center justify-center shadow-sm shrink-0">
            <Landmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 group-hover:text-emerald-800 tracking-tight truncate transition">
                {tr(lang, 'appTitle')}
              </h1>
              <span
                title={tr(lang, 'sampleDataTitle')}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0"
              >
                {hasRealOsmData ? tr(lang, 'osmMixedBadge') : tr(lang, 'sampleData')}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate">
              {tr(lang, 'appSubtitle')}
            </p>
          </div>
        </button>

        {/* Navigation Tabs & Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full xl:w-auto justify-between xl:justify-end">
          <nav
            aria-label="Primary navigation"
            className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 overflow-x-auto max-w-full"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChangeView(item.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tr(lang, item.labelKey)}</span>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Language Toggle: English / ಕನ್ನಡ */}
            <div
              className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200"
              role="group"
              aria-label="Language switch"
            >
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                  lang === 'en'
                    ? 'bg-white text-sky-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('kn')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition ${
                  lang === 'kn'
                    ? 'bg-white text-sky-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{tr(lang, 'add')}</span>
                <span className="hidden sm:inline">{tr(lang, 'asset')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportJson}
              title={tr(lang, 'export')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sky-800 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{tr(lang, 'export')}</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleResetClick}
                disabled={isResetting}
                title={tr(lang, 'resetDemoData')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-lg border text-xs font-medium transition disabled:opacity-60 ${
                  confirmReset
                    ? 'border-rose-300 bg-rose-600 text-white hover:bg-rose-700'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`}
                />
                <span className="hidden sm:inline">
                  {isResetting
                    ? tr(lang, 'resettingData')
                    : confirmReset
                    ? tr(lang, 'confirmShort')
                    : tr(lang, 'resetDemoData')}
                </span>
              </button>
            )}

            {/* User Role Pill & Sign Out */}
            <div className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg border border-slate-200 bg-slate-50">
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                  isAdmin ? 'text-emerald-800' : 'text-sky-800'
                }`}
              >
                {isAdmin ? (
                  <Shield className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-sky-700" />
                )}
                <span className="hidden sm:inline">
                  {isAdmin ? tr(lang, 'adminRole') : tr(lang, 'viewerRole')}
                </span>
              </span>
              <button
                type="button"
                onClick={onLogout}
                title={`${user?.displayName || user?.username} — ${tr(lang, 'signOut')}`}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition"
              >
                <LogOut className="w-3 h-3" />
                <span className="hidden md:inline">{tr(lang, 'signOut')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

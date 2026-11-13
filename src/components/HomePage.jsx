import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  BarChart2,
  ChevronRight,
  Download,
  ExternalLink,
  Landmark,
  LayoutGrid,
  Map as MapIcon,
  Printer,
  RotateCcw,
} from 'lucide-react';
import { tr } from '../i18n/translations';
import { flattenAssets, isAttentionNeeded } from '../utils/assetHelpers';

export function HomePage({
  lang = 'en',
  data,
  isAdmin,
  isResetting,
  onNavigate,
  onOpenPublicReport,
  onResetData,
  onExportJson,
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const reportUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/report`
      : '/report';

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(reportUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [reportUrl]);

  const metrics = useMemo(() => {
    const all = flattenAssets(data);
    const lights = data.streetLights || [];
    const workingLights = lights.filter((l) => l.status === 'working').length;
    const workingPct =
      lights.length > 0 ? Math.round((workingLights / lights.length) * 100) : 0;
    const openComplaints = (data.complaints || []).filter(
      (c) => c.status !== 'Resolved'
    ).length;
    const attentionCount = all.filter(isAttentionNeeded).length;

    return {
      totalAssets: all.length,
      workingPct,
      openComplaints,
      attentionCount,
      wardsCount: (data.wards || []).length,
    };
  }, [data]);

  const handleResetClick = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
      return;
    }
    setConfirmReset(false);
    onResetData();
  };

  const primaryActions = [
    {
      view: 'map',
      title: tr(lang, 'navMap'),
      description: tr(lang, 'homeCardMapDesc'),
      icon: MapIcon,
      accentBorder: 'hover:border-emerald-400',
      iconBox: 'bg-emerald-700 text-white',
      ctaColor: 'text-emerald-800',
      badge: `${metrics.totalAssets} ${tr(lang, 'assetsSuffix')}`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      view: 'dashboard',
      title: tr(lang, 'navDashboard'),
      description: tr(lang, 'homeCardDashboardDesc'),
      icon: BarChart2,
      accentBorder: 'hover:border-sky-400',
      iconBox: 'bg-sky-700 text-white',
      ctaColor: 'text-sky-800',
      badge: `${metrics.attentionCount} ${tr(lang, 'needingAttentionBadge')}`,
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    },
    {
      view: 'complaints',
      title: tr(lang, 'navComplaints'),
      description: tr(lang, 'homeCardComplaintsDesc'),
      icon: AlertTriangle,
      accentBorder: 'hover:border-blue-400',
      iconBox: 'bg-blue-700 text-white',
      ctaColor: 'text-blue-800',
      badge: `${metrics.openComplaints} ${tr(lang, 'complaintOpen')}`,
      badgeClass:
        metrics.openComplaints > 0
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      view: 'register',
      title: tr(lang, 'navPrint'),
      description: tr(lang, 'homeCardRegisterDesc'),
      icon: Printer,
      accentBorder: 'hover:border-teal-400',
      iconBox: 'bg-teal-700 text-white',
      ctaColor: 'text-teal-800',
      badge: 'A4 + CSV',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto print:overflow-visible custom-scrollbar bg-slate-50 print:bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-6 print:hidden">
        {/* Government-Style Hero Card (Green & Blue) */}
        <section className="rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-800 to-sky-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold">
                <Landmark className="w-3.5 h-3.5 text-emerald-200" />
                <span>{tr(lang, 'homeWelcomeBadge')}</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-300 text-slate-900">
                {data.meta?.hasRealOsmData
                  ? tr(lang, 'osmMixedBadge')
                  : tr(lang, 'sampleData')}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {tr(lang, 'appTitle')}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-sky-100 mt-1">
                {tr(lang, 'appSubtitle')}
              </p>
              <p className="text-sm text-emerald-50/95 mt-3 max-w-3xl leading-relaxed">
                {tr(lang, 'homeDescription')}
              </p>
            </div>

            {/* Quick Live Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5">
                <p className="text-[11px] text-emerald-100">{tr(lang, 'colTotal')}</p>
                <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  {metrics.totalAssets}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5">
                <p className="text-[11px] text-emerald-100">
                  {tr(lang, 'cardLightsWorking')}
                </p>
                <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  {metrics.workingPct}%
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5">
                <p className="text-[11px] text-emerald-100">
                  {tr(lang, 'navComplaints')}
                </p>
                <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  {metrics.openComplaints}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 border border-white/15 px-3.5 py-2.5">
                <p className="text-[11px] text-emerald-100">{tr(lang, 'navWards')}</p>
                <p className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  {metrics.wardsCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Large Navigation Cards: Map, Dashboard, Complaints, Register */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {primaryActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.view}
                type="button"
                onClick={() => onNavigate(action.view)}
                className={`group text-left bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4 ${action.accentBorder}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${action.iconBox}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${action.badgeClass}`}
                    >
                      {action.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition">
                      {action.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>

                <div
                  className={`inline-flex items-center gap-1 text-xs font-bold ${action.ctaColor}`}
                >
                  <span>{tr(lang, 'homeOpenAction')}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </section>

        {/* Secondary Row: Wards Overview + Export & Reset Demo Data */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('wards')}
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition">
                {tr(lang, 'homeCardWardsTitle')}
              </p>
              <p className="text-xs text-slate-500">{tr(lang, 'homeCardWardsDesc')}</p>
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExportJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-sky-700" />
              <span>{tr(lang, 'export')} JSON</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handleResetClick}
                disabled={isResetting}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-60 ${
                  confirmReset
                    ? 'border-rose-300 bg-rose-600 text-white hover:bg-rose-700'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`}
                />
                <span>
                  {isResetting
                    ? tr(lang, 'resettingData')
                    : confirmReset
                    ? tr(lang, 'confirmShort')
                    : tr(lang, 'resetDemoData')}
                </span>
              </button>
            )}
          </div>
        </section>

        {/* Notice Board QR Code Card (/report) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center gap-5">
          <div className="w-36 h-36 rounded-2xl border-2 border-slate-200 bg-white p-2 flex items-center justify-center shrink-0">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR code to public /report page"
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-[11px] text-slate-400">QR</span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              <span>{tr(lang, 'qrPosterHeaderKn')}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {tr(lang, 'qrCardTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {tr(lang, 'qrCardSub')}
            </p>
            <p className="text-xs font-mono text-sky-800 bg-sky-50 border border-sky-200 rounded-lg px-2.5 py-1 inline-block max-w-full truncate">
              {reportUrl}
            </p>
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={onOpenPublicReport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{tr(lang, 'qrOpenPublicForm')}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-700" />
                <span>{tr(lang, 'qrPrintPoster')}</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Printable A4 Notice Board Poster */}
      <div className="hidden print:flex flex-col items-center justify-center min-h-[265mm] p-10 text-center bg-white text-slate-900">
        <div className="border-4 border-emerald-800 rounded-3xl p-10 max-w-[180mm] w-full space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center">
              <Landmark className="w-8 h-8" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-extrabold text-emerald-900">
                ಹುಲಿಕೆರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ
              </p>
              <p className="text-lg font-bold text-slate-800">
                Hulikere Gram Panchayat, Mandya
              </p>
            </div>
          </div>

          <div className="border-y-2 border-slate-200 py-5 space-y-2">
            <p className="text-3xl font-extrabold text-slate-900">
              {tr('kn', 'qrPosterHeaderKn')}
            </p>
            <p className="text-xl font-bold text-sky-900 tracking-wide">
              {tr('en', 'qrPosterHeader')}
            </p>
          </div>

          {qrDataUrl && (
            <div className="mx-auto w-72 h-72 p-4 border-2 border-slate-800 rounded-3xl bg-white">
              <img
                src={qrDataUrl}
                alt="QR code for public complaint form"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-lg font-bold text-slate-900">
              {tr('kn', 'qrPosterScanInstructionKn')}
            </p>
            <p className="text-base font-semibold text-slate-700">
              {tr('en', 'qrPosterScanInstruction')}
            </p>
            <p className="text-sm text-slate-600 pt-1">
              ಬೀದಿ ದೀಪ • ನೀರು ಸೋರಿಕೆ • ರಸ್ತೆ ಹಾನಿ • ಟ್ಯಾಂಕ್ ಸಮಸ್ಯೆ
            </p>
            <p className="text-xs text-slate-500">
              Street Light • Water Leak • Road Damage • Tank Issue
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs font-mono font-bold text-slate-700">{reportUrl}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

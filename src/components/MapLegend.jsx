import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { tr } from '../i18n/translations';
import { CategoryIcon } from './CategoryIcon';

export function MapLegend({ lang }) {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const legendContent = (
    <div className="space-y-2.5 text-[11px]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          {tr(lang, 'legendAssetTypes')}
        </p>
        <div className="space-y-1.5">
          {/* Water Tanks */}
          <div className="flex items-center justify-between gap-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                <CategoryIcon category="waterTanks" className="w-3 h-3" />
              </span>
              <span>{tr(lang, 'legendWaterTank')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {tr(lang, 'legendSamplePill')}
            </span>
          </div>

          {/* Buildings */}
          <div className="flex items-center justify-between gap-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <CategoryIcon category="publicBuildings" className="w-3 h-3" />
              </span>
              <span>{tr(lang, 'legendBuilding')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {tr(lang, 'legendMixedPill')}
            </span>
          </div>

          {/* Street Lights */}
          <div className="flex items-center justify-between gap-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <CategoryIcon category="streetLights" className="w-3 h-3" />
              </span>
              <span>{tr(lang, 'legendStreetLight')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {tr(lang, 'legendSamplePill')}
            </span>
          </div>

          {/* Roads */}
          <div className="flex items-center justify-between gap-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-2 rounded-full bg-teal-600 inline-block shrink-0 border border-white shadow-sm" />
              <span>{tr(lang, 'legendRoadLine')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
              {tr(lang, 'legendRealOsm')}
            </span>
          </div>

          {/* Ward Boundaries (Sample) */}
          <div className="flex items-center justify-between gap-1.5 text-slate-700 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-2.5 rounded border border-dashed border-teal-600 bg-teal-500/10 inline-block shrink-0" />
              <span>{tr(lang, 'legendWardBoundaries')}</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              {tr(lang, 'legendSamplePill')}
            </span>
          </div>
        </div>
      </div>

      {/* Condition / Status indicators */}
      <div className="border-t border-slate-200/80 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          {tr(lang, 'legendConditionTitle')}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 ring-2 ring-emerald-200" />
            {tr(lang, 'goodWorkingOption')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
            {tr(lang, 'fairOption')}
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-200" />
            {tr(lang, 'poorFaultyOption')}
          </span>
        </div>
      </div>

      {/* Data Source Notice */}
      <div className="border-t border-slate-200/80 pt-2 text-[10px] text-slate-500">
        <p className="font-bold text-slate-600 mb-0.5">{tr(lang, 'legendDataSources')}:</p>
        <p className="leading-tight">
          <span className="font-semibold text-sky-800">{tr(lang, 'legendRealOsm')}:</span>{' '}
          {tr(lang, 'legendOsmDesc')}
        </p>
        <p className="leading-tight mt-1">
          <span className="font-semibold text-amber-800">{tr(lang, 'legendSamplePill')}:</span>{' '}
          {tr(lang, 'legendSampleDesc')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="absolute bottom-3 left-3 z-[400] max-w-[280px] sm:max-w-[320px]">
      {/* Desktop / Tablet Always-Visible Corner Legend */}
      <div className="hidden sm:block bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-xs font-bold text-slate-800">
            {tr(lang, 'mapLegend')}
          </span>
        </div>
        {legendContent}
      </div>

      {/* Mobile Compact Toggleable Corner Legend */}
      <div className="sm:hidden">
        {mobileExpanded && (
          <div className="mb-2 bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">
                {tr(lang, 'mapLegend')}
              </span>
              <button
                type="button"
                onClick={() => setMobileExpanded(false)}
                className="p-0.5 rounded text-slate-500"
                aria-label="Minimize legend"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            {legendContent}
          </div>
        )}
        <button
          type="button"
          onClick={() => setMobileExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/95 backdrop-blur border border-slate-200 shadow-md text-xs font-semibold text-slate-800"
        >
          <Info className="w-3.5 h-3.5 text-emerald-700" />
          <span>{tr(lang, 'mapLegend')}</span>
          <span className="flex items-center gap-0.5 ml-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="w-2 h-2 rounded-full bg-rose-600" />
          </span>
        </button>
      </div>
    </div>
  );
}

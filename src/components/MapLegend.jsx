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
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
              <CategoryIcon category="waterTanks" className="w-3 h-3" />
            </span>
            <span>{tr(lang, 'legendWaterTank')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <CategoryIcon category="publicBuildings" className="w-3 h-3" />
            </span>
            <span>{tr(lang, 'legendBuilding')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <CategoryIcon category="streetLights" className="w-3 h-3" />
            </span>
            <span>{tr(lang, 'legendStreetLight')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-5 h-2 rounded-full bg-teal-600 inline-block shrink-0 border border-white shadow-sm" />
            <span>{tr(lang, 'legendRoadLine')}</span>
          </div>
        </div>
      </div>

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
    </div>
  );

  return (
    <div className="absolute bottom-3 left-3 z-[400] max-w-[270px] sm:max-w-[300px]">
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

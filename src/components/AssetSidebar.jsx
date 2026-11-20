import React from 'react';
import { Search, X } from 'lucide-react';
import {
  getLocalizedName,
  getSecondaryName,
  tr,
  translateWardShort,
} from '../i18n/translations';
import {
  ASSET_CATEGORIES,
  getAssetSubtitle,
  getStatusValue,
} from '../utils/assetHelpers';
import { CategoryIcon } from './CategoryIcon';
import { StatusBadge } from './StatusBadge';

const CATEGORY_TABS = [
  { key: 'all', labelKey: 'all' },
  { key: 'waterTanks', labelKey: 'tanksShort' },
  { key: 'roads', labelKey: 'roads' },
  { key: 'publicBuildings', labelKey: 'buildingsShort' },
  { key: 'streetLights', labelKey: 'lightsShort' },
];

export function AssetSidebar({
  lang,
  isOpen,
  onClose,
  filteredAssets,
  totalCounts,
  wards,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  wardFilter,
  onWardChange,
  statusFilter,
  onStatusChange,
  selectedAssetKey,
  onSelectAsset,
  onClearFilters,
}) {
  if (!isOpen) return null;

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    categoryFilter !== 'all' ||
    wardFilter !== 'all' ||
    statusFilter !== 'all';

  return (
    <aside className="absolute inset-y-0 left-0 z-[500] w-full sm:w-[370px] bg-white border-r border-slate-200 shadow-2xl flex flex-col min-h-0">
      {/* Drawer Header */}
      <div className="px-3.5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {tr(lang, 'directoryTitle')}
          </h2>
          <p className="text-[11px] text-slate-500">
            {tr(lang, 'directorySubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition"
          aria-label="Close asset directory"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filters */}
      <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-white shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={tr(lang, 'searchPlaceholder')}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.key === 'all' ? totalCounts.all : totalCounts[tab.key] ?? 0;
            const active = categoryFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onCategoryChange(tab.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  active
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tr(lang, tab.labelKey)} ({count})
              </button>
            );
          })}
        </div>

        {/* Ward & Status Dropdowns */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={wardFilter}
            onChange={(e) => onWardChange(e.target.value)}
            aria-label={tr(lang, 'wardLabel')}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{tr(lang, 'allWards')}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.ward}>
                {getLocalizedName(w, lang)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            aria-label={tr(lang, 'conditionLabel')}
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{tr(lang, 'allConditions')}</option>
            <option value="good">{tr(lang, 'goodWorkingOption')}</option>
            <option value="fair">{tr(lang, 'fairOption')}</option>
            <option value="poor">{tr(lang, 'poorFaultyOption')}</option>
            <option value="unknown">{tr(lang, 'unknownOption')}</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>
            {tr(lang, 'showingAssets')}{' '}
            <strong className="text-slate-700">{filteredAssets.length}</strong>{' '}
            {tr(lang, 'assetsSuffix')}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              {tr(lang, 'clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Asset List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
        {filteredAssets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-slate-700">
              {tr(lang, 'noMatchingAssets')}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {tr(lang, 'adjustFiltersHint')}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100"
              >
                {tr(lang, 'resetFilters')}
              </button>
            )}
          </div>
        ) : (
          filteredAssets.map((item) => {
            const key = `${item.category}:${item.id}`;
            const isSelected = selectedAssetKey === key;
            const catMeta = ASSET_CATEGORIES[item.category];
            const statusVal = getStatusValue(item);

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectAsset(item.category, item.id)}
                className={`w-full text-left px-3.5 py-3 transition flex items-start gap-3 hover:bg-slate-50 ${
                  isSelected ? 'bg-emerald-50/70 ring-1 ring-inset ring-emerald-200' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${catMeta.bgClass}`}
                >
                  <CategoryIcon category={item.category} className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {getLocalizedName(item, lang)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {getSecondaryName(item, lang)}
                      </p>
                    </div>
                    <StatusBadge value={statusVal} lang={lang} />
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span className="truncate">
                      {getAssetSubtitle(item.category, item, lang)}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          item.dataSource === 'osm'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.dataSource === 'osm'
                          ? tr(lang, 'sourceOsm')
                          : tr(lang, 'sourceSample')}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {translateWardShort(item.ward, lang)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}

import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Droplets,
  Lightbulb,
  MapPin,
  Navigation,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getLocalizedName,
  getSecondaryName,
  tr,
  translateWardShort,
} from '../i18n/translations';
import {
  ASSET_CATEGORIES,
  flattenAssets,
  formatNumber,
  getAssetSubtitle,
  getStatusMeta,
  getStatusValue,
  isAttentionNeeded,
} from '../utils/assetHelpers';
import { CategoryIcon } from './CategoryIcon';
import { StatusBadge } from './StatusBadge';

const CHART_CATEGORIES = [
  { key: 'waterTanks', labelKey: 'waterTanks' },
  { key: 'roads', labelKey: 'roads' },
  { key: 'publicBuildings', labelKey: 'publicBuildings' },
  { key: 'streetLights', labelKey: 'streetLights' },
];

export function Dashboard({ lang = 'en', data, onOpenAssetOnMap, onInspectWard }) {
  const {
    wards = [],
    waterTanks = [],
    roads = [],
    publicBuildings = [],
    streetLights = [],
  } = data;

  const summary = useMemo(() => {
    const totalRoadMeters = roads.reduce(
      (sum, r) => sum + (Number(r.length) || 0),
      0
    );
    const totalRoadKm = (totalRoadMeters / 1000).toFixed(2);
    const totalTankLiters = waterTanks.reduce(
      (sum, t) => sum + (Number(t.capacity) || 0),
      0
    );
    const workingLights = streetLights.filter(
      (l) => l.status === 'working'
    ).length;
    const lightsWorkingPct =
      streetLights.length > 0
        ? Math.round((workingLights / streetLights.length) * 100)
        : 0;

    return {
      totalTanks: waterTanks.length,
      totalTankLiters,
      totalRoadKm,
      totalRoadsCount: roads.length,
      totalBuildings: publicBuildings.length,
      totalLights: streetLights.length,
      workingLights,
      faultyLights: streetLights.length - workingLights,
      lightsWorkingPct,
    };
  }, [waterTanks, roads, publicBuildings, streetLights]);

  const conditionChartData = useMemo(
    () =>
      CHART_CATEGORIES.map(({ key, labelKey }) => {
        const list = data[key] || [];
        let good = 0;
        let fair = 0;
        let poor = 0;
        let unknown = 0;
        for (const item of list) {
          const bucket = getStatusMeta(getStatusValue(item)).bucket;
          if (bucket === 'good') good += 1;
          else if (bucket === 'fair') fair += 1;
          else if (bucket === 'unknown') unknown += 1;
          else poor += 1;
        }
        return { name: tr(lang, labelKey), good, fair, poor, unknown };
      }),
    [data, lang]
  );

  const wardTableRows = useMemo(
    () =>
      wards.map((w) => {
        const wTanks = waterTanks.filter((t) => t.ward === w.ward);
        const wRoads = roads.filter((r) => r.ward === w.ward);
        const wBuildings = publicBuildings.filter((b) => b.ward === w.ward);
        const wLights = streetLights.filter((l) => l.ward === w.ward);
        const allWardAssets = [...wTanks, ...wRoads, ...wBuildings, ...wLights];
        const attentionCount = allWardAssets.filter(isAttentionNeeded).length;
        const roadMeters = wRoads.reduce(
          (sum, r) => sum + (Number(r.length) || 0),
          0
        );

        return {
          wardObj: w,
          tanks: wTanks.length,
          roads: wRoads.length,
          roadKm: (roadMeters / 1000).toFixed(2),
          buildings: wBuildings.length,
          lights: wLights.length,
          total: allWardAssets.length,
          attention: attentionCount,
        };
      }),
    [wards, waterTanks, roads, publicBuildings, streetLights]
  );

  const needsAttentionAssets = useMemo(
    () => flattenAssets(data).filter(isAttentionNeeded),
    [data]
  );

  const summaryCards = [
    {
      label: tr(lang, 'cardTotalTanks'),
      value: summary.totalTanks,
      sub: `${formatNumber(summary.totalTankLiters)} ${tr(
        lang,
        'unitLitersShort'
      )} ${tr(lang, 'cardCombinedCapacity')}`,
      icon: Droplets,
      iconClass: 'bg-sky-100 text-sky-700',
    },
    {
      label: tr(lang, 'cardTotalRoadLength'),
      value: `${summary.totalRoadKm} km`,
      sub: `${tr(lang, 'cardMappedRoadsPrefix')} ${summary.totalRoadsCount} ${tr(
        lang,
        'cardMappedRoadsSuffix'
      )}`,
      icon: Navigation,
      iconClass: 'bg-teal-100 text-teal-700',
    },
    {
      label: tr(lang, 'cardPublicBuildings'),
      value: summary.totalBuildings,
      sub: tr(lang, 'cardBuildingsSub'),
      icon: Building2,
      iconClass: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: tr(lang, 'cardTotalLights'),
      value: summary.totalLights,
      sub: `${summary.workingLights} ${tr(lang, 'statusWorking')} • ${
        summary.faultyLights
      } ${tr(lang, 'statusFaulty')}`,
      icon: Lightbulb,
      iconClass: 'bg-amber-100 text-amber-700',
    },
    {
      label: tr(lang, 'cardLightsWorking'),
      value: `${summary.lightsWorkingPct}%`,
      sub: `${summary.workingLights} / ${summary.totalLights} ${tr(
        lang,
        'cardPolesActiveSuffix'
      )}`,
      icon: CheckCircle2,
      iconClass: 'bg-emerald-100 text-emerald-700',
      progress: summary.lightsWorkingPct,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 sm:p-5 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Page Heading */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {tr(lang, 'dashboardTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tr(lang, 'dashboardSubtitle')} • {flattenAssets(data).length}{' '}
              {tr(lang, 'totalAssetsSuffix')}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
            <AlertTriangle
              className={`w-3.5 h-3.5 ${
                needsAttentionAssets.length > 0
                  ? 'text-rose-600'
                  : 'text-emerald-600'
              }`}
            />
            <span>
              {needsAttentionAssets.length} {tr(lang, 'needingAttentionBadge')}
            </span>
          </span>
        </div>

        {/* Summary KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-500">
                    {card.label}
                  </p>
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.iconClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                    {card.value}
                  </p>
                  {typeof card.progress === 'number' && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2.5">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${card.progress}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-2">{card.sub}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Chart + Ward-Wise Table */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Bar Chart: Asset Condition by Type */}
          <div className="xl:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm min-w-0 flex flex-col">
            <div className="mb-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {tr(lang, 'chartTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tr(lang, 'chartSubtitle')}
              </p>
            </div>

            <div className="w-full h-[290px] min-w-0">
              <ResponsiveContainer width="100%" height={290} minWidth={240}>
                <BarChart
                  data={conditionChartData}
                  margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 8px 20px rgba(15,23,42,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="good"
                    name={tr(lang, 'goodWorkingOption')}
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="fair"
                    name={tr(lang, 'fairOption')}
                    fill="#d97706"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={26}
                  />
                  <Bar
                    dataKey="poor"
                    name={tr(lang, 'poorFaultyOption')}
                    fill="#dc2626"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                  <Bar
                    dataKey="unknown"
                    name={tr(lang, 'unknownOption')}
                    fill="#64748b"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ward-Wise Asset Breakdown Table */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {tr(lang, 'wardTableTitle')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {tr(lang, 'wardTableSubtitle')}
              </p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">{tr(lang, 'colWard')}</th>
                    <th className="py-3 px-3 text-center">{tr(lang, 'colTanks')}</th>
                    <th className="py-3 px-3 text-center">{tr(lang, 'colRoads')}</th>
                    <th className="py-3 px-3 text-center">{tr(lang, 'colBuildings')}</th>
                    <th className="py-3 px-3 text-center">{tr(lang, 'colLights')}</th>
                    <th className="py-3 px-3 text-center">{tr(lang, 'colTotal')}</th>
                    <th className="py-3 px-4 text-right">{tr(lang, 'colNeedsAttention')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {wardTableRows.map((row) => (
                    <tr
                      key={row.wardObj.id}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onInspectWard(row.wardObj)}
                          className="text-left group"
                        >
                          <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition">
                            {getLocalizedName(row.wardObj, lang)}
                          </p>
                          {getSecondaryName(row.wardObj, lang) && (
                            <p className="text-[11px] text-slate-500">
                              {getSecondaryName(row.wardObj, lang)}
                            </p>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {row.tanks}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-slate-800">
                          {row.roads}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          {row.roadKm} km
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {row.buildings}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-800">
                        {row.lights}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900">
                        {row.total}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.attention > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {row.attention}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200 text-xs font-bold text-slate-900">
                    <td className="py-3 px-4">{tr(lang, 'gpTotalRow')}</td>
                    <td className="py-3 px-3 text-center">{summary.totalTanks}</td>
                    <td className="py-3 px-3 text-center">
                      {summary.totalRoadsCount} ({summary.totalRoadKm} km)
                    </td>
                    <td className="py-3 px-3 text-center">{summary.totalBuildings}</td>
                    <td className="py-3 px-3 text-center">{summary.totalLights}</td>
                    <td className="py-3 px-3 text-center">
                      {flattenAssets(data).length}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-700">
                      {needsAttentionAssets.length}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </section>

        {/* Needs Attention List */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {tr(lang, 'needsAttentionTitle')} ({needsAttentionAssets.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {tr(lang, 'needsAttentionSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {needsAttentionAssets.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                {tr(lang, 'noPoorAssets')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {tr(lang, 'allHealthySub')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {needsAttentionAssets.map((item) => {
                const catMeta = ASSET_CATEGORIES[item.category];
                const statusVal = getStatusValue(item);
                const latestNote =
                  item.notes ||
                  item.maintenanceHistory?.[0]?.notes ||
                  getAssetSubtitle(item.category, item, lang);

                return (
                  <div
                    key={`${item.category}:${item.id}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${catMeta.bgClass}`}
                      >
                        <CategoryIcon category={item.category} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                            {item.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                              item.dataSource === 'osm'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {item.dataSource === 'osm'
                              ? tr(lang, 'sourceOsm')
                              : tr(lang, 'sourceSample')}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {getLocalizedName(item, lang)}
                          </h4>
                          <StatusBadge value={statusVal} lang={lang} />
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {translateWardShort(item.ward, lang)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {getSecondaryName(item, lang)
                            ? `${getSecondaryName(item, lang)} • `
                            : ''}
                          {getAssetSubtitle(item.category, item, lang)}
                        </p>
                        {latestNote && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                            {latestNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenAssetOnMap(item.category, item.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold shadow-sm transition shrink-0 self-start sm:self-center"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{tr(lang, 'openOnMap')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

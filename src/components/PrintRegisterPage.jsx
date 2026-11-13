import React, { useMemo, useState } from 'react';
import { Download, Landmark, Printer } from 'lucide-react';
import {
  getLocalizedName,
  tr,
  translateAssetType,
  translateStatus,
  translateWardShort,
} from '../i18n/translations';
import { formatDate, formatNumber } from '../utils/assetHelpers';

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadCsvFile(filename, headers, rows) {
  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function PrintRegisterPage({ data, lang }) {
  const [wardFilter, setWardFilter] = useState('all');

  const todayIso = new Date().toISOString().slice(0, 10);
  const formattedToday = formatDate(todayIso);

  const wards = data.wards || [];

  const filterByWard = (items) => {
    const list = items || [];
    if (wardFilter === 'all') return list;
    return list.filter((i) => i.ward === wardFilter);
  };

  const tanks = useMemo(() => filterByWard(data.waterTanks), [data.waterTanks, wardFilter]);
  const roads = useMemo(() => filterByWard(data.roads), [data.roads, wardFilter]);
  const buildings = useMemo(
    () => filterByWard(data.publicBuildings),
    [data.publicBuildings, wardFilter]
  );
  const lights = useMemo(
    () => filterByWard(data.streetLights),
    [data.streetLights, wardFilter]
  );

  const selectedWardObj = wards.find((w) => w.ward === wardFilter);
  const wardScopeLabel = selectedWardObj
    ? getLocalizedName(selectedWardObj, lang)
    : tr(lang, 'allWards');

  const totalRecords = tanks.length + roads.length + buildings.length + lights.length;

  const tables = [
    {
      key: 'waterTanks',
      filename: `hulikere-water-tanks-${todayIso}.csv`,
      title: tr(lang, 'waterTanks'),
      headers: [
        tr(lang, 'colSlNo'),
        tr(lang, 'colId'),
        tr(lang, 'colAssetName'),
        tr(lang, 'colWard'),
        tr(lang, 'specTankType'),
        tr(lang, 'capacityLitersLabel'),
        tr(lang, 'specHouseholdsServed'),
        tr(lang, 'specYearBuilt'),
        tr(lang, 'specLastCleaned'),
        tr(lang, 'colCondition'),
      ],
      rows: tanks.map((t, idx) => [
        idx + 1,
        t.id,
        getLocalizedName(t, lang),
        translateWardShort(t.ward, lang),
        translateAssetType(t.type, lang),
        formatNumber(t.capacity),
        formatNumber(t.householdsServed),
        t.yearBuilt || '—',
        formatDate(t.lastCleaningDate),
        translateStatus(t.condition, lang),
      ]),
    },
    {
      key: 'roads',
      filename: `hulikere-roads-${todayIso}.csv`,
      title: tr(lang, 'roads'),
      headers: [
        tr(lang, 'colSlNo'),
        tr(lang, 'colId'),
        tr(lang, 'colRoadName'),
        tr(lang, 'colWard'),
        tr(lang, 'specSurfaceType'),
        tr(lang, 'lengthMetersLabel'),
        tr(lang, 'widthMetersLabel'),
        tr(lang, 'specLastRepaired'),
        tr(lang, 'colCondition'),
      ],
      rows: roads.map((r, idx) => [
        idx + 1,
        r.id,
        getLocalizedName(r, lang),
        translateWardShort(r.ward, lang),
        translateAssetType(r.type, lang),
        formatNumber(r.length),
        r.width ?? '—',
        formatDate(r.lastRepaired),
        translateStatus(r.condition, lang),
      ]),
    },
    {
      key: 'publicBuildings',
      filename: `hulikere-public-buildings-${todayIso}.csv`,
      title: tr(lang, 'publicBuildings'),
      headers: [
        tr(lang, 'colSlNo'),
        tr(lang, 'colId'),
        tr(lang, 'colBuildingName'),
        tr(lang, 'colWard'),
        tr(lang, 'specFacilityType'),
        tr(lang, 'specYearBuilt'),
        tr(lang, 'colCondition'),
      ],
      rows: buildings.map((b, idx) => [
        idx + 1,
        b.id,
        getLocalizedName(b, lang),
        translateWardShort(b.ward, lang),
        translateAssetType(b.type, lang),
        b.yearBuilt || '—',
        translateStatus(b.condition, lang),
      ]),
    },
    {
      key: 'streetLights',
      filename: `hulikere-street-lights-${todayIso}.csv`,
      title: tr(lang, 'streetLights'),
      headers: [
        tr(lang, 'colSlNo'),
        tr(lang, 'colId'),
        tr(lang, 'colPoleName'),
        tr(lang, 'specPoleNumber'),
        tr(lang, 'colWard'),
        tr(lang, 'specLampType'),
        tr(lang, 'specInstalledDate'),
        tr(lang, 'colStatus'),
      ],
      rows: lights.map((l, idx) => [
        idx + 1,
        l.id,
        getLocalizedName(l, lang),
        l.poleNumber || '—',
        translateWardShort(l.ward, lang),
        translateAssetType(l.type, lang),
        formatDate(l.installedDate),
        translateStatus(l.status, lang),
      ]),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto print:overflow-visible bg-slate-100 print:bg-white p-4 sm:p-6 print:p-0">
      {/* Screen Toolbar (Hidden in Print) */}
      <div className="max-w-[210mm] mx-auto mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm print:hidden">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {tr(lang, 'printPageTitle')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tr(lang, 'printPageSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            aria-label={tr(lang, 'wardLabel')}
            className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{tr(lang, 'allWards')}</option>
            {wards.map((w) => (
              <option key={w.id} value={w.ward}>
                {getLocalizedName(w, lang)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>{tr(lang, 'printButton')}</span>
          </button>
        </div>
      </div>

      {/* Printable A4 Document */}
      <div className="max-w-[210mm] mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:shadow-none print:border-0 print:rounded-none print:p-0 print:max-w-none space-y-6">
        {/* Official Panchayat Header */}
        <header className="border-b-2 border-slate-800 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 print:border-slate-700">
                <Landmark className="w-6 h-6 text-emerald-800 print:text-slate-900" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {tr(lang, 'panchayatName')}
                </h1>
                <p className="text-xs font-medium text-slate-600">
                  {tr(lang, 'appSubtitle')}
                </p>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-700 space-y-0.5">
              <p>
                <span className="font-semibold">{tr(lang, 'registerDateLabel')}</span>{' '}
                {formattedToday}
              </p>
              <p>
                <span className="font-semibold">{tr(lang, 'registerScopeLabel')}</span>{' '}
                {wardScopeLabel}
              </p>
              <p>
                <span className="font-semibold">
                  {tr(lang, 'registerTotalRecordsLabel')}
                </span>{' '}
                {totalRecords}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 text-center">
            <p className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-900">
              {tr(lang, 'registerHeaderTitle')}
            </p>
          </div>
        </header>

        {/* Four Asset Tables */}
        <div className="space-y-7">
          {tables.map((table) => (
            <section key={table.key} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>{table.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 print:border-slate-400">
                    {table.rows.length}
                  </span>
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    downloadCsvFile(table.filename, table.headers, table.rows)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition print:hidden"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{tr(lang, 'downloadCsv')}</span>
                </button>
              </div>

              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full border-collapse border border-slate-300 print:border-slate-700 text-[11px] text-left">
                  <thead>
                    <tr className="bg-slate-100 print:bg-slate-200 text-slate-800">
                      {table.headers.map((head) => (
                        <th
                          key={head}
                          className="border border-slate-300 print:border-slate-700 px-2 py-1.5 font-bold whitespace-nowrap"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={table.headers.length}
                          className="border border-slate-300 px-3 py-4 text-center text-slate-500"
                        >
                          —
                        </td>
                      </tr>
                    ) : (
                      table.rows.map((row, rIdx) => (
                        <tr key={`${table.key}-${rIdx}`} className="odd:bg-white even:bg-slate-50/50">
                          {row.map((cell, cIdx) => (
                            <td
                              key={`${table.key}-${rIdx}-${cIdx}`}
                              className="border border-slate-300 print:border-slate-700 px-2 py-1.5 text-slate-800 align-top"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>

        {/* Bottom Signature Block */}
        <footer className="print-section-keep pt-10 mt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs text-slate-800">
          <div className="pt-8">
            <div className="border-t border-slate-700 w-52 pt-1.5">
              <p className="font-bold">{tr(lang, 'preparedByLabel')}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {tr(lang, 'signatureDateSeal')}
              </p>
            </div>
          </div>

          <div className="pt-8 flex justify-end">
            <div className="border-t border-slate-700 w-56 pt-1.5 text-right">
              <p className="font-bold">{tr(lang, 'pdoSignatureLabel')}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {tr(lang, 'panchayatName')} • {tr(lang, 'signatureDateSeal')}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

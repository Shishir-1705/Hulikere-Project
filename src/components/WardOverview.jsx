import React from 'react';
import {
  Building2,
  Droplets,
  Lightbulb,
  MapPin,
  Navigation,
  Users,
} from 'lucide-react';
import { getLocalizedName, getSecondaryName, tr } from '../i18n/translations';
import { StatusBadge } from './StatusBadge';

export function WardOverview({ lang = 'en', data, onInspectWard }) {
  const { wards, waterTanks, roads, publicBuildings, streetLights } = data;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {tr(lang, 'wardsOverviewTitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tr(lang, 'wardsOverviewSub')}
            </p>
          </div>
          <div className="text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
            {tr(lang, 'totalHouseholds')}{' '}
            <strong className="text-slate-900">
              {wards.reduce((sum, w) => sum + (Number(w.households) || 0), 0)}
            </strong>{' '}
            • {tr(lang, 'populationLabel')}{' '}
            <strong className="text-slate-900">
              {wards.reduce((sum, w) => sum + (Number(w.population) || 0), 0)}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {wards.map((ward) => {
            const wTanks = waterTanks.filter((t) => t.ward === ward.ward);
            const wRoads = roads.filter((r) => r.ward === ward.ward);
            const wBuildings = publicBuildings.filter((b) => b.ward === ward.ward);
            const wLights = streetLights.filter((l) => l.ward === ward.ward);

            const workingLights = wLights.filter((l) => l.status === 'working').length;
            const faultyLights = wLights.filter((l) => l.status === 'faulty').length;
            const roadMeters = wRoads.reduce(
              (sum, r) => sum + (Number(r.length) || 0),
              0
            );
            const poorAssets =
              wTanks.filter((t) => t.condition === 'poor').length +
              wRoads.filter((r) => r.condition === 'poor').length +
              wBuildings.filter((b) => b.condition === 'poor').length +
              faultyLights;

            return (
              <div
                key={ward.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {ward.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {getLocalizedName(ward, lang)}
                      </h3>
                      {getSecondaryName(ward, lang) && (
                        <p className="text-xs text-slate-500">
                          {getSecondaryName(ward, lang)}
                        </p>
                      )}
                    </div>
                    <StatusBadge value={ward.status} lang={lang} />
                  </div>

                  {/* Ward Demographics */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      <span>
                        <strong className="text-slate-800">{ward.households}</strong>{' '}
                        {tr(lang, 'unitHH')} •{' '}
                        <strong className="text-slate-800">{ward.population}</strong>{' '}
                        {tr(lang, 'popShort')}
                      </span>
                    </span>
                    <span className="text-slate-500 truncate max-w-[140px]">
                      {tr(lang, 'repPrefix')} {ward.representative}
                    </span>
                  </div>

                  {/* Asset Breakdown */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {wTanks.length} {tr(lang, 'colTanks')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {wTanks
                            .reduce((s, t) => s + (Number(t.capacity) || 0), 0)
                            .toLocaleString('en-IN')}{' '}
                          {tr(lang, 'unitLitersShort')}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {wRoads.length} {tr(lang, 'colRoads')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {roadMeters} {tr(lang, 'unitMetersShort')}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {wBuildings.length} {tr(lang, 'colBuildings')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {tr(lang, 'publicFacilitiesSub')}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200/80 p-2.5 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                        <Lightbulb className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {wLights.length} {tr(lang, 'colLights')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {workingLights} {tr(lang, 'statusWorking')}
                          {faultyLights > 0 ? (
                            <span className="text-rose-600 font-semibold">
                              {' '}
                              • {faultyLights} {tr(lang, 'statusFaulty')}
                            </span>
                          ) : (
                            ''
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-semibold ${
                      poorAssets > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {poorAssets > 0
                      ? `${poorAssets} ${tr(lang, 'itemsNeedAttention')}`
                      : tr(lang, 'allAssetsHealthy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => onInspectWard(ward)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'viewOnMap')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

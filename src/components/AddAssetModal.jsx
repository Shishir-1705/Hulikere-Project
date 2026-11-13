import React, { useState } from 'react';
import { Crosshair, MapPin, X } from 'lucide-react';
import { tr } from '../i18n/translations';
import { generateNextId } from '../utils/assetHelpers';
import { AssetFormFields } from './AssetFormFields';
import { CategoryIcon } from './CategoryIcon';
import { PhotoCaptureInput } from './PhotoCaptureInput';

const CATEGORIES = [
  { key: 'waterTanks', singularKey: 'waterTankSingular' },
  { key: 'roads', singularKey: 'roadSingular' },
  { key: 'publicBuildings', singularKey: 'publicBuildingSingular' },
  { key: 'streetLights', singularKey: 'streetLightSingular' },
];

export function AddAssetModal({
  lang = 'en',
  isOpen,
  isHiddenForPick,
  category,
  form,
  wards,
  existingAssets,
  onChangeCategory,
  onChangeForm,
  photoDraft,
  onChangePhotoDraft,
  onStartPickOnMap,
  onClose,
  onSubmit,
}) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  if (!isOpen || isHiddenForPick) return null;

  const nextId = generateNextId(category, existingAssets[category]);

  const handleUseCurrentLocation = () => {
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by this browser. Use "Pick on Map" instead.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        if (category === 'roads') {
          onChangeForm({
            ...form,
            polylinePoints: [
              [lat, lng],
              [Number((lat + 0.0005).toFixed(6)), Number((lng + 0.0005).toFixed(6))],
            ],
          });
        } else {
          onChangeForm({
            ...form,
            lat,
            lng,
          });
        }
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === 1
            ? 'Location permission denied. Click "Pick on Map" to choose coordinates.'
            : 'Unable to fetch GPS location. Click "Pick on Map" to choose coordinates.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {tr(lang, 'addVillageAsset')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tr(lang, 'newIdPrefix')}{' '}
              <span className="font-mono font-semibold text-slate-700">{nextId}</span> •{' '}
              {tr(lang, 'savedLocallyInBrowser')}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="add-asset-form"
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4"
        >
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {tr(lang, 'assetCategory')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      setGeoError('');
                      onChangeCategory(cat.key);
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition ${
                      active
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CategoryIcon category={cat.key} className="w-4 h-4" />
                    <span className="truncate max-w-full">
                      {tr(lang, cat.singularKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AssetFormFields
            lang={lang}
            category={category}
            form={form}
            onChange={onChangeForm}
            wards={wards}
          />

          <PhotoCaptureInput
            lang={lang}
            label={tr(lang, 'photoFieldLabel')}
            photoDraft={photoDraft}
            onChange={onChangePhotoDraft}
          />

          {/* Map Location Picker & Current Location */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs text-slate-700">
                <p className="font-semibold text-emerald-900">
                  {category === 'roads'
                    ? tr(lang, 'roadGeometryLabel')
                    : tr(lang, 'mapLocationLabel')}
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {category === 'roads'
                    ? `${form.polylinePoints?.length || 0} ${tr(
                        lang,
                        'pointsSelectedSuffix'
                      )}`
                    : `${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold transition disabled:opacity-60"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>
                    {locating ? tr(lang, 'locating') : tr(lang, 'useCurrentLocation')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onStartPickOnMap}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>
                    {category === 'roads'
                      ? tr(lang, 'traceOnMap')
                      : tr(lang, 'pickOnMap')}
                  </span>
                </button>
              </div>
            </div>

            {geoError && (
              <p className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                {geoError}
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            {tr(lang, 'cancel')}
          </button>
          <button
            type="submit"
            form="add-asset-form"
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
          >
            {tr(lang, 'saveAsset')}
          </button>
        </div>
      </div>
    </div>
  );
}

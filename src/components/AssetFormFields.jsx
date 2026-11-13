import React from 'react';
import {
  getLocalizedName,
  tr,
  translateAssetType,
  translateStatus,
} from '../i18n/translations';
import {
  BUILDING_TYPES,
  LIGHT_TYPES,
  ROAD_TYPES,
  WATER_TANK_TYPES,
} from '../utils/assetHelpers';

const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500';
const LABEL_CLASS = 'block text-xs font-semibold text-slate-700 mb-1';

export function AssetFormFields({ lang = 'en', category, form, onChange, wards }) {
  const updateField = (key, value) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL_CLASS}>{tr(lang, 'nameEnLabel')}</label>
        <input
          type="text"
          required
          value={form.nameEn}
          onChange={(e) => updateField('nameEn', e.target.value)}
          placeholder="e.g., Main Overhead Tank"
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>{tr(lang, 'nameKnLabel')}</label>
        <input
          type="text"
          required
          value={form.nameKn}
          onChange={(e) => updateField('nameKn', e.target.value)}
          placeholder="ಉದಾ: ಮುಖ್ಯ ನೀರಿನ ಟ್ಯಾಂಕ್"
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL_CLASS}>{tr(lang, 'wardLabel')} *</label>
          <select
            value={form.ward}
            onChange={(e) => updateField('ward', e.target.value)}
            className={INPUT_CLASS}
          >
            {wards.map((w) => (
              <option key={w.id} value={w.ward}>
                {getLocalizedName(w, lang)}
              </option>
            ))}
          </select>
        </div>

        {category === 'streetLights' ? (
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'statusFieldLabel')}</label>
            <select
              value={form.status}
              onChange={(e) => updateField('status', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="working">{translateStatus('working', lang)}</option>
              <option value="faulty">{translateStatus('faulty', lang)}</option>
            </select>
          </div>
        ) : (
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'conditionFieldLabel')}</label>
            <select
              value={form.condition}
              onChange={(e) => updateField('condition', e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="good">{translateStatus('good', lang)}</option>
              <option value="fair">{translateStatus('fair', lang)}</option>
              <option value="poor">{translateStatus('poor', lang)}</option>
            </select>
          </div>
        )}
      </div>

      {/* Water Tank Fields */}
      {category === 'waterTanks' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'specTankType')}</label>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
                className={INPUT_CLASS}
              >
                {WATER_TANK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {translateAssetType(t.value, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'capacityLitersLabel')}</label>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'specYearBuilt')}</label>
              <input
                type="number"
                min="1950"
                max="2030"
                value={form.yearBuilt}
                onChange={(e) => updateField('yearBuilt', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'hhServedLabel')}</label>
              <input
                type="number"
                min="0"
                value={form.householdsServed}
                onChange={(e) => updateField('householdsServed', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'specLastCleaned')}</label>
              <input
                type="date"
                value={form.lastCleaningDate}
                onChange={(e) => updateField('lastCleaningDate', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </>
      )}

      {/* Road Fields */}
      {category === 'roads' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'specSurfaceType')}</label>
              <select
                value={form.type}
                onChange={(e) => updateField('type', e.target.value)}
                className={INPUT_CLASS}
              >
                {ROAD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {translateAssetType(t.value, lang)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'specLastRepaired')}</label>
              <input
                type="date"
                value={form.lastRepaired}
                onChange={(e) => updateField('lastRepaired', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'lengthMetersLabel')}</label>
              <input
                type="number"
                min="1"
                value={form.length}
                onChange={(e) => updateField('length', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>{tr(lang, 'widthMetersLabel')}</label>
              <input
                type="number"
                min="0.5"
                step="0.1"
                value={form.width}
                onChange={(e) => updateField('width', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
        </>
      )}

      {/* Public Building Fields */}
      {category === 'publicBuildings' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'specFacilityType')}</label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className={INPUT_CLASS}
            >
              {BUILDING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {translateAssetType(t.value, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'specYearBuilt')}</label>
            <input
              type="number"
              min="1950"
              max="2030"
              value={form.yearBuilt}
              onChange={(e) => updateField('yearBuilt', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      )}

      {/* Street Light Fields */}
      {category === 'streetLights' && (
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'specPoleNumber')}</label>
            <input
              type="text"
              value={form.poleNumber}
              onChange={(e) => updateField('poleNumber', e.target.value)}
              placeholder="HGP-P31"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'specLampType')}</label>
            <select
              value={form.type}
              onChange={(e) => updateField('type', e.target.value)}
              className={INPUT_CLASS}
            >
              {LIGHT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {translateAssetType(t.value, lang)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'specInstalledDate')}</label>
            <input
              type="date"
              value={form.installedDate}
              onChange={(e) => updateField('installedDate', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      )}

      {/* Point Coordinates */}
      {category !== 'roads' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'latitudeLabel')}</label>
            <input
              type="number"
              step="0.000001"
              value={form.lat}
              onChange={(e) => updateField('lat', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>{tr(lang, 'longitudeLabel')}</label>
            <input
              type="number"
              step="0.000001"
              value={form.lng}
              onChange={(e) => updateField('lng', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>{tr(lang, 'remarksNotesLabel')}</label>
        <textarea
          rows={2}
          value={form.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder={tr(lang, 'remarksNotesPlaceholder')}
          className={INPUT_CLASS}
        />
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Camera,
  Check,
  Clock,
  Edit2,
  Eye,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  getLocalizedName,
  getSecondaryName,
  tr,
  translateAssetType,
  translateStatus,
  translateWardShort,
} from '../i18n/translations';
import {
  ASSET_CATEGORIES,
  assetToForm,
  createMaintenanceEntry,
  formatDate,
  formatNumber,
  formToAsset,
  getAssetCenter,
  getStatusValue,
} from '../utils/assetHelpers';
import {
  deletePhoto,
  generatePhotoId,
  savePhotoBlob,
} from '../utils/photoStorage';
import { AssetFormFields } from './AssetFormFields';
import { CategoryIcon } from './CategoryIcon';
import { PhotoCaptureInput } from './PhotoCaptureInput';
import { StatusBadge } from './StatusBadge';
import { StoredPhoto } from './StoredPhoto';

const CATEGORY_SINGULAR_KEYS = {
  waterTanks: 'waterTankSingular',
  roads: 'roadSingular',
  publicBuildings: 'publicBuildingSingular',
  streetLights: 'streetLightSingular',
};

function getSpecRows(category, asset, lang) {
  if (category === 'waterTanks') {
    return [
      { label: tr(lang, 'specTankType'), value: translateAssetType(asset.type, lang) },
      {
        label: tr(lang, 'specCapacity'),
        value: `${formatNumber(asset.capacity)} ${tr(lang, 'unitLiters')}`,
      },
      {
        label: tr(lang, 'specHouseholdsServed'),
        value: `${formatNumber(asset.householdsServed)} ${tr(lang, 'unitHH')}`,
      },
      { label: tr(lang, 'specYearBuilt'), value: asset.yearBuilt },
      { label: tr(lang, 'specLastCleaned'), value: formatDate(asset.lastCleaningDate) },
      {
        label: tr(lang, 'specCoordinates'),
        value: Array.isArray(asset.coordinates)
          ? `${asset.coordinates[0].toFixed(5)}, ${asset.coordinates[1].toFixed(5)}`
          : '—',
      },
    ];
  }
  if (category === 'roads') {
    return [
      { label: tr(lang, 'specSurfaceType'), value: translateAssetType(asset.type, lang) },
      {
        label: tr(lang, 'specLength'),
        value: `${formatNumber(asset.length)} ${tr(lang, 'unitMeters')}`,
      },
      {
        label: tr(lang, 'specWidth'),
        value: `${asset.width} ${tr(lang, 'unitMeters')}`,
      },
      { label: tr(lang, 'specLastRepaired'), value: formatDate(asset.lastRepaired) },
      {
        label: tr(lang, 'specPolylinePoints'),
        value: `${Array.isArray(asset.coordinates) ? asset.coordinates.length : 0} ${tr(
          lang,
          'unitVertices'
        )}`,
      },
      { label: tr(lang, 'wardLabel'), value: translateWardShort(asset.ward, lang) },
    ];
  }
  if (category === 'publicBuildings') {
    return [
      {
        label: tr(lang, 'specFacilityType'),
        value: translateAssetType(asset.type, lang),
      },
      { label: tr(lang, 'specYearBuilt'), value: asset.yearBuilt },
      { label: tr(lang, 'wardLabel'), value: translateWardShort(asset.ward, lang) },
      {
        label: tr(lang, 'specCoordinates'),
        value: Array.isArray(asset.coordinates)
          ? `${asset.coordinates[0].toFixed(5)}, ${asset.coordinates[1].toFixed(5)}`
          : '—',
      },
    ];
  }
  return [
    { label: tr(lang, 'specPoleNumber'), value: asset.poleNumber },
    { label: tr(lang, 'specLampType'), value: translateAssetType(asset.type, lang) },
    { label: tr(lang, 'specInstalledDate'), value: formatDate(asset.installedDate) },
    {
      label: tr(lang, 'specCoordinates'),
      value: Array.isArray(asset.coordinates)
        ? `${asset.coordinates[0].toFixed(5)}, ${asset.coordinates[1].toFixed(5)}`
        : '—',
    },
  ];
}

function AssetPhotoPlaceholder({ category, asset, lang }) {
  const center = getAssetCenter(category, asset);
  const bgGradient =
    category === 'waterTanks'
      ? 'from-sky-50 via-cyan-50 to-slate-100 border-sky-200/80'
      : category === 'roads'
      ? 'from-teal-50 via-emerald-50 to-slate-100 border-teal-200/80'
      : category === 'publicBuildings'
      ? 'from-indigo-50 via-slate-50 to-slate-100 border-indigo-200/80'
      : 'from-amber-50 via-orange-50 to-slate-100 border-amber-200/80';

  const iconBg =
    category === 'waterTanks'
      ? 'bg-sky-100 text-sky-700'
      : category === 'roads'
      ? 'bg-teal-100 text-teal-700'
      : category === 'publicBuildings'
      ? 'bg-indigo-100 text-indigo-700'
      : 'bg-amber-100 text-amber-700';

  const placeholderBody = (
    <div
      className={`relative w-full h-full rounded-xl border bg-gradient-to-br ${bgGradient} flex flex-col items-center justify-center p-4 overflow-hidden`}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm mb-2 ${iconBg}`}
        >
          <Camera className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700">
          {tr(lang, 'sitePhotoPlaceholder')}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {tr(lang, 'photoNotUploaded')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative rounded-xl border border-slate-200 bg-slate-100 aspect-[16/9] overflow-hidden">
      {asset.photoId ? (
        <StoredPhoto
          photoId={asset.photoId}
          alt={getLocalizedName(asset, lang)}
          loadingLabel={tr(lang, 'loadingPhoto')}
          fallback={placeholderBody}
        />
      ) : (
        placeholderBody
      )}

      <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-md bg-white/90 border border-slate-200 text-[10px] font-mono font-semibold text-slate-700 pointer-events-none">
        {asset.id}
      </span>
      <span className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/75 text-[10px] font-mono text-white pointer-events-none">
        <MapPin className="w-2.5 h-2.5" />
        {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E
      </span>
    </div>
  );
}

export function AssetDetailDrawer({
  lang = 'en',
  selected,
  wards,
  isAdmin,
  assetComplaints = [],
  allAssetComplaints = [],
  onClose,
  onUpdateAsset,
  onDeleteAsset,
  onReportProblem,
  onViewComplaints,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState(null);
  const [editPhotoDraft, setEditPhotoDraft] = useState(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);

  const [addingLog, setAddingLog] = useState(false);
  const [logAction, setLogAction] = useState('');
  const [logBy, setLogBy] = useState('Panchayat Development Officer');
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    setIsEditing(false);
    setConfirmDelete(false);
    setAddingLog(false);
    setLogAction('');
    setLogNotes('');
    setEditPhotoDraft(null);
    setRemoveExistingPhoto(false);
    if (selected?.asset) {
      setForm(assetToForm(selected.category, selected.asset));
    } else {
      setForm(null);
    }
  }, [selected?.category, selected?.asset?.id]);

  if (!selected?.asset) return null;

  const { category, asset } = selected;
  const catMeta = ASSET_CATEGORIES[category];
  const statusVal = getStatusValue(asset);
  const today = new Date().toISOString().slice(0, 10);
  const history = Array.isArray(asset.maintenanceHistory)
    ? [...asset.maintenanceHistory].sort((a, b) =>
        String(b.date || '').localeCompare(String(a.date || ''))
      )
    : [];

  const handleQuickStatus = (nextValue) => {
    const patch =
      category === 'streetLights' ? { status: nextValue } : { condition: nextValue };
    const entry = createMaintenanceEntry(
      category === 'streetLights'
        ? `Street light marked ${nextValue}`
        : `Condition updated to ${nextValue}`,
      'Updated via map quick field control'
    );
    onUpdateAsset(category, {
      ...asset,
      ...patch,
      maintenanceHistory: [entry, ...(asset.maintenanceHistory || [])],
    });
  };

  const handleLogToday = () => {
    if (category === 'waterTanks') {
      const entry = createMaintenanceEntry(
        'Tank cleaning & chlorination logged',
        'Recorded via field inspection panel',
        'GP Watermen Team',
        today
      );
      onUpdateAsset(category, {
        ...asset,
        lastCleaningDate: today,
        maintenanceHistory: [entry, ...(asset.maintenanceHistory || [])],
      });
    } else if (category === 'roads') {
      const entry = createMaintenanceEntry(
        'Road repair completed',
        'Condition set to good after repair',
        'GP Works Team',
        today
      );
      onUpdateAsset(category, {
        ...asset,
        lastRepaired: today,
        condition: 'good',
        maintenanceHistory: [entry, ...(asset.maintenanceHistory || [])],
      });
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!form?.nameEn.trim()) return;

    let nextPhotoId = removeExistingPhoto ? null : asset.photoId || null;

    if (editPhotoDraft?.blob) {
      const newPhotoId = generatePhotoId('ASSET');
      await savePhotoBlob(newPhotoId, editPhotoDraft.blob, { assetId: asset.id });
      if (asset.photoId) {
        await deletePhoto(asset.photoId);
      }
      nextPhotoId = newPhotoId;
    } else if (removeExistingPhoto && asset.photoId) {
      await deletePhoto(asset.photoId);
    }

    const updated = formToAsset(
      category,
      { ...form, photoId: nextPhotoId },
      asset.id,
      asset.maintenanceHistory || [],
      asset
    );
    onUpdateAsset(category, updated);
    setEditPhotoDraft(null);
    setRemoveExistingPhoto(false);
    setIsEditing(false);
  };

  const handleAddMaintenanceLog = (e) => {
    e.preventDefault();
    if (!logAction.trim()) return;
    const entry = createMaintenanceEntry(logAction, logNotes, logBy, today);
    onUpdateAsset(category, {
      ...asset,
      maintenanceHistory: [entry, ...(asset.maintenanceHistory || [])],
    });
    setAddingLog(false);
    setLogAction('');
    setLogNotes('');
  };

  const handleDeleteClick = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    onDeleteAsset(category, asset.id);
  };

  const specRows = getSpecRows(category, asset, lang);

  return (
    <aside className="w-full md:w-[390px] lg:w-[420px] bg-white border-l border-slate-200 flex flex-col h-full shadow-2xl z-[450] absolute md:static inset-0 md:inset-auto shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/90 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${catMeta.bgClass}`}
          >
            <CategoryIcon category={category} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {tr(lang, CATEGORY_SINGULAR_KEYS[category])}
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                {asset.id}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  asset.dataSource === 'osm'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {asset.dataSource === 'osm'
                  ? tr(lang, 'sourceTagOsm')
                  : tr(lang, 'sourceTagSample')}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-0.5">
              {translateWardShort(asset.ward, lang)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition"
          aria-label="Close side panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {isEditing && form ? (
          <form id="edit-asset-form" onSubmit={handleSaveEdit} className="space-y-4">
            <AssetFormFields
              lang={lang}
              category={category}
              form={form}
              onChange={setForm}
              wards={wards}
            />
            <PhotoCaptureInput
              lang={lang}
              label={tr(lang, 'photoFieldLabel')}
              photoDraft={editPhotoDraft}
              existingPhotoId={removeExistingPhoto ? null : asset.photoId || null}
              onChange={(draft) => {
                setEditPhotoDraft(draft);
                if (draft) setRemoveExistingPhoto(false);
              }}
              onRemoveExisting={() => setRemoveExistingPhoto(true)}
            />
          </form>
        ) : (
          <>
            {/* Photo Placeholder */}
            <AssetPhotoPlaceholder category={category} asset={asset} lang={lang} />

            {/* Title & Status */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {getLocalizedName(asset, lang)}
                </h2>
                <StatusBadge value={statusVal} size="md" lang={lang} />
              </div>
              {getSecondaryName(asset, lang) && (
                <p className="text-sm text-slate-600 mt-1">
                  {getSecondaryName(asset, lang)}
                </p>
              )}
            </div>

            {/* Report a Problem Button + Linked Complaints Banner */}
            <div className="space-y-2">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => onReportProblem(category, asset)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{tr(lang, 'reportProblem')}</span>
                </button>
              ) : (
                <div className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2 flex items-center gap-2 text-xs text-slate-600">
                  <Eye className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{tr(lang, 'viewerReadOnlyNotice')}</span>
                </div>
              )}

              {assetComplaints.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-amber-900">
                    {assetComplaints.length} {tr(lang, 'complaintsLoggedSuffix')}
                  </span>
                  <button
                    type="button"
                    onClick={onViewComplaints}
                    className="text-[11px] font-bold text-emerald-800 hover:underline shrink-0"
                  >
                    {tr(lang, 'viewComplaints')}
                  </button>
                </div>
              )}
            </div>

            {/* Quick Field Update Controls (Admin Only) */}
            {isAdmin && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {tr(lang, 'quickFieldUpdate')}
                </p>

                {category === 'streetLights' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {['working', 'faulty'].map((opt) => {
                      const active = asset.status === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleQuickStatus(opt)}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                            active
                              ? opt === 'working'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {translateStatus(opt, lang)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1.5">
                    {['good', 'fair', 'poor'].map((opt) => {
                      const active = asset.condition === opt;
                      const activeClass =
                        opt === 'good'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : opt === 'fair'
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-rose-600 text-white border-rose-600';
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleQuickStatus(opt)}
                          className={`py-2 px-2 rounded-lg text-xs font-semibold border transition ${
                            active
                              ? `${activeClass} shadow-sm`
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {translateStatus(opt, lang)}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(category === 'waterTanks' || category === 'roads') && (
                  <button
                    type="button"
                    onClick={handleLogToday}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold transition"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {category === 'waterTanks'
                        ? tr(lang, 'logTankCleanedToday')
                        : tr(lang, 'logRoadRepairedToday')}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* All Asset Details */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                {tr(lang, 'assetSpecifications')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {specRows.map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg border border-slate-200/80 bg-white px-3 py-2"
                  >
                    <p className="text-[11px] text-slate-500">{row.label}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                      {row.value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {asset.notes && (
              <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {tr(lang, 'remarksLabel')}
                </p>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {asset.notes}
                </p>
              </div>
            )}

            {/* Complaint Photos Strip */}
            {allAssetComplaints.some((c) => Boolean(c.photoId)) && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {tr(lang, 'problemPhotosTitle')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {allAssetComplaints
                    .filter((c) => Boolean(c.photoId))
                    .map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden"
                      >
                        <div className="h-24 bg-slate-100">
                          <StoredPhoto
                            photoId={c.photoId}
                            alt={`${c.id} photo`}
                            loadingLabel={tr(lang, 'loadingPhoto')}
                          />
                        </div>
                        <div className="px-2 py-1 text-[10px] text-slate-600 flex items-center justify-between">
                          <span className="font-mono font-semibold">{c.id}</span>
                          <span>{formatDate(c.date)}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Maintenance History */}
            <div className="border-t border-slate-200 pt-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                    {tr(lang, 'maintenanceHistory')} ({history.length})
                  </p>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setAddingLog((v) => !v)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{addingLog ? tr(lang, 'cancel') : tr(lang, 'addLog')}</span>
                  </button>
                )}
              </div>

              {isAdmin && addingLog && (
                <form
                  onSubmit={handleAddMaintenanceLog}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2"
                >
                  <input
                    type="text"
                    required
                    value={logAction}
                    onChange={(e) => setLogAction(e.target.value)}
                    placeholder={tr(lang, 'logActionPlaceholder')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={logBy}
                    onChange={(e) => setLogBy(e.target.value)}
                    placeholder={tr(lang, 'logByPlaceholder')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <textarea
                    rows={2}
                    value={logNotes}
                    onChange={(e) => setLogNotes(e.target.value)}
                    placeholder={tr(lang, 'logNotesPlaceholder')}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
                  >
                    {tr(lang, 'saveLogEntry')}
                  </button>
                </form>
              )}

              {history.length === 0 ? (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200/70">
                  {tr(lang, 'noHistoryRecorded')}
                </p>
              ) : (
                <ol className="relative border-l border-slate-200 ml-2 space-y-3 pl-4">
                  {history.map((entry) => (
                    <li key={entry.id} className="relative">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-200 absolute -left-[21px] top-1" />
                      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {entry.action}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                        {entry.performedBy && (
                          <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                            {entry.performedBy}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Actions (Admin Only) */}
      {isAdmin && (
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setForm(assetToForm(category, asset));
                  setEditPhotoDraft(null);
                  setRemoveExistingPhoto(false);
                  setIsEditing(false);
                }}
                className="flex-1 py-2.5 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                {tr(lang, 'cancel')}
              </button>
              <button
                type="submit"
                form="edit-asset-form"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{tr(lang, 'saveChangesLabel')}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleDeleteClick}
                className={`inline-flex items-center gap-1.5 py-2.5 px-3 rounded-lg border text-xs font-semibold transition ${
                  confirmDelete
                    ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                    : 'bg-white text-rose-600 border-slate-200 hover:bg-rose-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {confirmDelete
                    ? tr(lang, 'confirmDeleteLabel')
                    : tr(lang, 'deleteLabel')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(assetToForm(category, asset));
                  setEditPhotoDraft(null);
                  setRemoveExistingPhoto(false);
                  setIsEditing(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{tr(lang, 'editDetailsLabel')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}

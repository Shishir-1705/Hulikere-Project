import {
  tr,
  translateAssetType,
  translateWardShort,
} from '../i18n/translations';

export const ASSET_CATEGORIES = {
  waterTanks: {
    key: 'waterTanks',
    label: 'Water Tanks',
    singular: 'Water Tank',
    labelKn: 'ನೀರಿನ ಟ್ಯಾಂಕ್‌ಗಳು',
    color: '#0284c7',
    bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
    badgeClass: 'bg-sky-100 text-sky-800',
    prefix: 'WT',
  },
  roads: {
    key: 'roads',
    label: 'Roads',
    singular: 'Road',
    labelKn: 'ರಸ್ತೆಗಳು',
    color: '#0d9488',
    bgClass: 'bg-teal-50 text-teal-700 border-teal-200',
    badgeClass: 'bg-teal-100 text-teal-800',
    prefix: 'RD',
  },
  publicBuildings: {
    key: 'publicBuildings',
    label: 'Public Buildings',
    singular: 'Public Building',
    labelKn: 'ಸಾರ್ವಜನಿಕ ಕಟ್ಟಡಗಳು',
    color: '#4f46e5',
    bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    badgeClass: 'bg-indigo-100 text-indigo-800',
    prefix: 'PB',
  },
  streetLights: {
    key: 'streetLights',
    label: 'Street Lights',
    singular: 'Street Light',
    labelKn: 'ಬೀದಿ ದೀಪಗಳು',
    color: '#d97706',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-800',
    prefix: 'SL',
  },
};

export const WATER_TANK_TYPES = [
  { value: 'overhead', label: 'Overhead Tank (OHT)' },
  { value: 'ground-level', label: 'Ground-Level Reservoir (GLSR)' },
  { value: 'open well', label: 'Open Well' },
  { value: 'borewell', label: 'Borewell' },
];

export const ROAD_TYPES = [
  { value: 'CC', label: 'CC (Cement Concrete)' },
  { value: 'tar', label: 'Tar (Bituminous)' },
  { value: 'WBM', label: 'WBM (Water Bound Macadam)' },
  { value: 'kaccha', label: 'Kaccha (Unpaved)' },
];

export const BUILDING_TYPES = [
  { value: 'panchayat office', label: 'Panchayat Office' },
  { value: 'primary school', label: 'Primary School' },
  { value: 'anganwadi', label: 'Anganwadi Centre' },
  { value: 'PHC', label: 'Primary Health Centre (PHC)' },
  { value: 'community hall', label: 'Community Hall' },
  { value: 'temple hall', label: 'Temple Hall' },
];

export const LIGHT_TYPES = [
  { value: 'LED', label: 'LED' },
  { value: 'CFL', label: 'CFL' },
];

export function getStatusValue(asset) {
  return asset.condition || asset.status || 'good';
}

export function getStatusMeta(value) {
  const v = String(value || '').toLowerCase();
  if (v === 'good' || v === 'working' || v === 'active') {
    return {
      label: v === 'working' ? 'Working' : v === 'active' ? 'Active' : 'Good',
      colorHex: '#16a34a',
      pillClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dotClass: 'bg-emerald-500',
      bucket: 'good',
    };
  }
  if (v === 'fair') {
    return {
      label: 'Fair',
      colorHex: '#d97706',
      pillClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotClass: 'bg-amber-500',
      bucket: 'fair',
    };
  }
  if (v === 'unknown') {
    return {
      label: 'Unknown',
      colorHex: '#64748b',
      pillClass: 'bg-slate-100 text-slate-700 border border-slate-300',
      dotClass: 'bg-slate-400',
      bucket: 'unknown',
    };
  }
  return {
    label: v === 'faulty' ? 'Faulty' : 'Poor',
    colorHex: '#dc2626',
    pillClass: 'bg-rose-50 text-rose-700 border border-rose-200',
    dotClass: 'bg-rose-500',
    bucket: 'poor',
  };
}

export function isAttentionNeeded(asset) {
  const val = getStatusValue(asset).toLowerCase();
  return val === 'poor' || val === 'faulty';
}

export function flattenAssets(data) {
  const groups = ['waterTanks', 'roads', 'publicBuildings', 'streetLights'];
  const all = [];
  for (const category of groups) {
    const list = Array.isArray(data[category]) ? data[category] : [];
    for (const item of list) {
      all.push({ ...item, category });
    }
  }
  return all;
}

export function getAssetCenter(category, item) {
  if (!item || !Array.isArray(item.coordinates)) return [12.57056, 76.77363];
  if (category === 'roads') {
    const pts = item.coordinates;
    if (pts.length === 0) return [12.57056, 76.77363];
    const mid = pts[Math.floor(pts.length / 2)];
    return Array.isArray(mid) && mid.length === 2 ? mid : [12.57056, 76.77363];
  }
  return item.coordinates.length === 2 ? item.coordinates : [12.57056, 76.77363];
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatNumber(num) {
  if (num === null || num === undefined || Number.isNaN(Number(num))) return '—';
  return Number(num).toLocaleString('en-IN');
}

export function generateNextId(category, items) {
  const prefix =
    category === 'complaints'
      ? 'CMP'
      : ASSET_CATEGORIES[category]?.prefix || 'AS';
  let maxNum = 0;
  for (const item of items || []) {
    const match = String(item.id || '').match(/(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(2, '0')}`;
}

export function getAssetSubtitle(category, item, lang = 'en') {
  if (category === 'waterTanks') {
    return `${formatNumber(item.capacity)} ${tr(lang, 'unitLitersShort')} • ${item.householdsServed} ${tr(
      lang,
      'unitHH'
    )} • ${translateAssetType(item.type, lang)}`;
  }
  if (category === 'roads') {
    return `${formatNumber(item.length)} ${tr(lang, 'unitMetersShort')} × ${
      item.width
    } ${tr(lang, 'unitMetersShort')} • ${translateAssetType(item.type, lang)}`;
  }
  if (category === 'publicBuildings') {
    return `${translateAssetType(item.type, lang)} • ${tr(lang, 'builtPrefix')} ${
      item.yearBuilt
    }`;
  }
  if (category === 'streetLights') {
    return `${tr(lang, 'polePrefix')} ${item.poleNumber} • ${translateAssetType(
      item.type,
      lang
    )}`;
  }
  return translateWardShort(item.ward, lang);
}

export function createDefaultForm(category, wards = []) {
  const today = new Date().toISOString().slice(0, 10);
  const firstWard = wards[0]?.ward || 'Ward 1';
  const base = {
    nameEn: '',
    nameKn: '',
    ward: firstWard,
    notes: '',
    lat: 12.5706,
    lng: 76.7736,
  };

  if (category === 'waterTanks') {
    return {
      ...base,
      type: 'overhead',
      capacity: 15000,
      yearBuilt: 2024,
      condition: 'good',
      lastCleaningDate: today,
      householdsServed: 40,
    };
  }
  if (category === 'roads') {
    return {
      ...base,
      type: 'CC',
      length: 200,
      width: 3.5,
      condition: 'good',
      lastRepaired: today,
      polylinePoints: [
        [12.5702, 76.7725],
        [12.5710, 76.7745],
      ],
    };
  }
  if (category === 'publicBuildings') {
    return {
      ...base,
      type: 'community hall',
      yearBuilt: 2022,
      condition: 'good',
    };
  }
  return {
    ...base,
    poleNumber: 'HGP-P31',
    type: 'LED',
    status: 'working',
    installedDate: today,
  };
}

export function assetToForm(category, asset) {
  const isRoad = category === 'roads';
  const coords = Array.isArray(asset.coordinates) ? asset.coordinates : [];
  return {
    nameEn: asset.name?.en || '',
    nameKn: asset.name?.kn || '',
    ward: asset.ward || 'Ward 1',
    notes: asset.notes || '',
    lat: !isRoad && coords.length === 2 ? coords[0] : 12.5706,
    lng: !isRoad && coords.length === 2 ? coords[1] : 76.7736,
    polylinePoints: isRoad ? coords : [],
    type: asset.type || '',
    condition: asset.condition || 'good',
    status: asset.status || 'working',
    capacity: asset.capacity ?? 10000,
    yearBuilt: asset.yearBuilt ?? 2020,
    lastCleaningDate: asset.lastCleaningDate || '',
    householdsServed: asset.householdsServed ?? 0,
    length: asset.length ?? 100,
    width: asset.width ?? 3.5,
    lastRepaired: asset.lastRepaired || '',
    poleNumber: asset.poleNumber || '',
    installedDate: asset.installedDate || '',
  };
}

export function createMaintenanceEntry(action, notes = '', performedBy = 'PDO / GP Office', date) {
  return {
    id: `MH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    date: date || new Date().toISOString().slice(0, 10),
    action: action.trim(),
    performedBy: performedBy.trim() || 'PDO / GP Office',
    notes: notes.trim(),
  };
}

export function formToAsset(
  category,
  form,
  existingId,
  existingHistory = null,
  existingAsset = null
) {
  const maintenanceHistory = Array.isArray(existingHistory)
    ? existingHistory
    : [createMaintenanceEntry('Asset added to Gram Panchayat registry', form.notes || 'Initial record created')];

  const common = {
    id: existingId,
    name: {
      en: form.nameEn.trim(),
      kn: form.nameKn.trim() || form.nameEn.trim(),
    },
    ward: form.ward,
    notes: form.notes?.trim() || '',
    maintenanceHistory,
    ...(existingAsset?.dataSource ? { dataSource: existingAsset.dataSource } : {}),
    ...(typeof existingAsset?.isSample === 'boolean'
      ? { isSample: existingAsset.isSample }
      : {}),
    ...(existingAsset?.osmId ? { osmId: existingAsset.osmId } : {}),
    ...(existingAsset?.osmTags ? { osmTags: existingAsset.osmTags } : {}),
    ...(form.photoId !== undefined
      ? form.photoId
        ? { photoId: form.photoId }
        : {}
      : existingAsset?.photoId
      ? { photoId: existingAsset.photoId }
      : {}),
  };

  if (category === 'roads') {
    return {
      ...common,
      type: form.type,
      length: Number(form.length) || 0,
      width: Number(form.width) || 0,
      condition: form.condition,
      lastRepaired: form.lastRepaired,
      coordinates:
        Array.isArray(form.polylinePoints) && form.polylinePoints.length >= 2
          ? form.polylinePoints
          : [
              [12.5702, 76.7725],
              [12.5710, 76.7745],
            ],
    };
  }

  const coordinates = [
    Number(form.lat) || 12.5706,
    Number(form.lng) || 76.7736,
  ];

  if (category === 'waterTanks') {
    return {
      ...common,
      type: form.type,
      capacity: Number(form.capacity) || 0,
      yearBuilt: Number(form.yearBuilt) || 2020,
      condition: form.condition,
      lastCleaningDate: form.lastCleaningDate,
      householdsServed: Number(form.householdsServed) || 0,
      coordinates,
    };
  }

  if (category === 'publicBuildings') {
    return {
      ...common,
      type: form.type,
      yearBuilt: Number(form.yearBuilt) || 2020,
      condition: form.condition,
      coordinates,
    };
  }

  return {
    ...common,
    poleNumber: form.poleNumber.trim() || existingId,
    type: form.type,
    status: form.status,
    installedDate: form.installedDate,
    coordinates,
  };
}


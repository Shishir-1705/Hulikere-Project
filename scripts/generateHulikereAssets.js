import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const osmPath = path.resolve(__dirname, '../src/data/osm.json');
const assetsPath = path.resolve(__dirname, '../src/data/assets.json');

const osm = JSON.parse(await fs.readFile(osmPath, 'utf8'));
const [south, west, north, east] = osm.metadata.bbox;
const [centerLat, centerLng] = osm.metadata.center;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 5 Wards partitioning the bounding box
// Center: [12.57056, 76.77363]
// We define:
// Ward 1: Central Village Core (Gramatana)
// Ward 2: North-East (Hulikere Koppalu)
// Ward 3: North-West (Doddakeri)
// Ward 4: South-West (Visvesvaraya Nale / Canal & Farmlands)
// Ward 5: South-East (Kere Angala)

const cLatMin = 12.5670;
const cLatMax = 12.5740;
const cLngMin = 76.7700;
const cLngMax = 76.7770;

export const wards = [
  {
    id: 'WARD-01',
    name: {
      en: 'Ward 1 - Gramatana (Village Centre)',
      kn: 'ವಾರ್ಡ್ 1 - ಗ್ರಾಮಠಾಣಾ (ಕೇಂದ್ರ)',
    },
    ward: 'Ward 1',
    status: 'active',
    wardNumber: 1,
    households: 118,
    population: 495,
    representative: 'H.N. Manjunath',
    center: [12.57056, 76.77363],
    polygon: [
      [12.5735, 76.7712],
      [12.5738, 76.7758],
      [12.5695, 76.7765],
      [12.5678, 76.7738],
      [12.5684, 76.7710],
    ],
  },
  {
    id: 'WARD-02',
    name: {
      en: 'Ward 2 - Hulikere Koppalu',
      kn: 'ವಾರ್ಡ್ 2 - ಹುಲಿಕೆರೆ ಕೊಪ್ಪಲು',
    },
    ward: 'Ward 2',
    status: 'active',
    wardNumber: 2,
    households: 96,
    population: 412,
    representative: 'B.R. Savithramma',
    center: [12.5765, 76.7800],
    polygon: [
      [12.5788, 76.7770],
      [12.5815, 76.7825],
      [12.5745, 76.7840],
      [12.5728, 76.7785],
      [12.5750, 76.7760],
    ],
  },
  {
    id: 'WARD-03',
    name: {
      en: 'Ward 3 - Doddakeri (North-West)',
      kn: 'ವಾರ್ಡ್ 3 - ದೊಡ್ಡಕೇರಿ',
    },
    ward: 'Ward 3',
    status: 'active',
    wardNumber: 3,
    households: 88,
    population: 375,
    representative: 'K.S. Puttegowda',
    center: [12.5765, 76.7665],
    polygon: [
      [12.5805, 76.7645],
      [12.5775, 76.7710],
      [12.5732, 76.7705],
      [12.5725, 76.7640],
      [12.5770, 76.7625],
    ],
  },
  {
    id: 'WARD-04',
    name: {
      en: 'Ward 4 - Visvesvaraya Nale (South-West)',
      kn: 'ವಾರ್ಡ್ 4 - ವಿಶ್ವೇಶ್ವರಯ್ಯ ನಾಲೆ',
    },
    ward: 'Ward 4',
    status: 'active',
    wardNumber: 4,
    households: 76,
    population: 320,
    representative: 'Lakshmi Narasimha',
    center: [12.5635, 76.7665],
    polygon: [
      [12.5680, 76.7635],
      [12.5685, 76.7695],
      [12.5615, 76.7715],
      [12.5595, 76.7650],
      [12.5630, 76.7620],
    ],
  },
  {
    id: 'WARD-05',
    name: {
      en: 'Ward 5 - Kere Angala (South-East)',
      kn: 'ವಾರ್ಡ್ 5 - ಕೆರೆ ಅಂಗಳ',
    },
    ward: 'Ward 5',
    status: 'active',
    wardNumber: 5,
    households: 82,
    population: 348,
    representative: 'C. Mahadevaiah',
    center: [12.5635, 76.7800],
    polygon: [
      [12.5685, 76.7770],
      [12.5675, 76.7835],
      [12.5605, 76.7845],
      [12.5598, 76.7775],
      [12.5645, 76.7755],
    ],
  },
];

export function pointInPolygon(lat, lng, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function assignWard(lat, lng) {
  // Check Ward 1 first (central core)
  if (pointInPolygon(lat, lng, wards[0].polygon)) {
    return 'Ward 1';
  }
  for (let i = 1; i < wards.length; i++) {
    if (pointInPolygon(lat, lng, wards[i].polygon)) {
      return wards[i].ward;
    }
  }
  // fallback to nearest center
  let best = 'Ward 1';
  let minD = Infinity;
  for (const w of wards) {
    const d = haversineMeters(lat, lng, w.center[0], w.center[1]);
    if (d < minD) {
      minD = d;
      best = w.ward;
    }
  }
  return best;
}

// Extract road segments
const roadSegments = [];
for (const feature of osm.features) {
  if (feature.properties.category !== 'road') continue;
  const coords = feature.geometry.coordinates;
  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    if (
      (lat1 >= south && lat1 <= north && lon1 >= west && lon1 <= east) ||
      (lat2 >= south && lat2 <= north && lon2 >= west && lon2 <= east)
    ) {
      const midLat = (lat1 + lat2) / 2;
      const midLon = (lon1 + lon2) / 2;
      const ward = assignWard(midLat, midLon);
      const segLen = haversineMeters(lat1, lon1, lat2, lon2);
      roadSegments.push({
        roadId: feature.id,
        highway: feature.properties.highway,
        p1: [lat1, lon1],
        p2: [lat2, lon2],
        mid: [midLat, midLon],
        ward,
        segLen,
      });
    }
  }
}

// Group segments by ward
const segmentsByWard = {
  'Ward 1': [],
  'Ward 2': [],
  'Ward 3': [],
  'Ward 4': [],
  'Ward 5': [],
};

for (const seg of roadSegments) {
  if (segmentsByWard[seg.ward]) {
    segmentsByWard[seg.ward].push(seg);
  }
}

console.log('Road segments per ward:');
for (const [w, segs] of Object.entries(segmentsByWard)) {
  console.log(`  ${w}: ${segs.length} segments`);
}

// Generate 6 street lights per ward (total 30 street lights)
// Snapped on road segments, spaced roughly 35-45m apart
const streetLights = [];
let lightIndex = 1;

for (const wardObj of wards) {
  const wName = wardObj.ward;
  const segs = segmentsByWard[wName];
  let wardLights = 0;

  // If a ward has fewer direct segments, sample from nearest available segments
  const pool = segs.length >= 6 ? segs : roadSegments;

  // Step through segments to pick points spaced 35-45m apart
  for (let sIdx = 0; sIdx < pool.length && wardLights < 6; sIdx++) {
    const seg = pool[sIdx];
    const [lat1, lon1] = seg.p1;
    const [lat2, lon2] = seg.p2;
    const len = seg.segLen;

    if (len < 10) continue;

    // Place lights along the segment
    const spacing = 40; // 40m
    const countOnSeg = Math.max(1, Math.min(2, Math.floor(len / spacing)));

    for (let k = 1; k <= countOnSeg && wardLights < 6; k++) {
      const ratio = k / (countOnSeg + 1);
      const snapLat = Number((lat1 + ratio * (lat2 - lat1)).toFixed(6));
      const snapLng = Number((lon1 + ratio * (lon2 - lon1)).toFixed(6));

      // 4 faulty lights across the village (~13%)
      const isFaulty = [4, 11, 19, 26].includes(lightIndex);

      streetLights.push({
        id: `SL-${String(lightIndex).padStart(2, '0')}`,
        poleNumber: `HLK-P-${String(lightIndex).padStart(2, '0')}`,
        ward: wName,
        status: isFaulty ? 'faulty' : 'working',
        wattage: [40, 60, 70, 90][(lightIndex - 1) % 4],
        installedDate: '2023-04-15',
        lastCheckedDate: '2026-10-10',
        coordinates: [snapLat, snapLng],
        notes: `Snapped on OSM road ${seg.roadId} (${seg.highway || 'road'})`,
        dataSource: 'sample',
        isSample: true,
      });

      wardLights++;
      lightIndex++;
    }
  }
}

console.log(`Generated ${streetLights.length} street lights.`);
const finalLightWardCounts = {};
streetLights.forEach((l) => {
  finalLightWardCounts[l.ward] = (finalLightWardCounts[l.ward] || 0) + 1;
});
console.log('Final street lights per ward:', finalLightWardCounts);

// Generate 6 Water Tanks near roads across the 5 wards
const waterTanks = [
  {
    id: 'WT-01',
    name: {
      en: 'Village Core Overhead Tank (OHT-1)',
      kn: 'ಗ್ರಾಮ ಕೇಂದ್ರ ಮೇಲ್ಮಟ್ಟದ ಜಲಸಂಗ್ರಹಾಗಾರ (OHT-1)',
    },
    ward: 'Ward 1',
    type: 'overhead',
    capacity: 50000,
    yearBuilt: 2018,
    condition: 'good',
    lastCleaningDate: '2026-09-12',
    householdsServed: 110,
    coordinates: [12.5714, 76.7738],
    notes: '50,000 litre primary overhead tank near Panchayat office',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'WT-02',
    name: {
      en: 'School Road Mini Water Supply Tank',
      kn: 'ಶಾಲಾ ರಸ್ತೆ ಮಿನಿ ನೀರು ಸರಬರಾಜು ಟ್ಯಾಂಕ್',
    },
    ward: 'Ward 1',
    type: 'mini',
    capacity: 5000,
    yearBuilt: 2021,
    condition: 'poor',
    lastCleaningDate: '2026-06-18',
    householdsServed: 35,
    coordinates: [12.5698, 76.7725],
    notes: 'Inlet pipe valve leaking, complaint logged',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'WT-03',
    name: {
      en: 'Hulikere Koppalu Overhead Tank (OHT-2)',
      kn: 'ಹುಲಿಕೆರೆ ಕೊಪ್ಪಲು ಓವರ್‌ಹೆಡ್ ಟ್ಯಾಂಕ್',
    },
    ward: 'Ward 2',
    type: 'overhead',
    capacity: 40000,
    yearBuilt: 2019,
    condition: 'good',
    lastCleaningDate: '2026-08-05',
    householdsServed: 85,
    coordinates: [12.5755, 76.7782],
    notes: 'Supplies Ward 2 residential layout',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'WT-04',
    name: {
      en: 'Doddakeri Ground Level Reservoir (GLSR)',
      kn: 'ದೊಡ್ಡಕೇರಿ ನೆಲಮಟ್ಟದ ಜಲಸಂಗ್ರಹಾಗಾರ (GLSR)',
    },
    ward: 'Ward 3',
    type: 'ground',
    capacity: 30000,
    yearBuilt: 2017,
    condition: 'fair',
    lastCleaningDate: '2026-07-20',
    householdsServed: 70,
    coordinates: [12.5748, 76.7678],
    notes: 'Pumphouse functional, mild seepage on boundary wall',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'WT-05',
    name: {
      en: 'Visvesvaraya Canal Feeder Borewell Tank',
      kn: 'ವಿಶ್ವೇಶ್ವರಯ್ಯ ನಾಲೆ ಕೊಳವೆಬಾವಿ ಟ್ಯಾಂಕ್',
    },
    ward: 'Ward 4',
    type: 'mini',
    capacity: 5000,
    yearBuilt: 2022,
    condition: 'good',
    lastCleaningDate: '2026-09-01',
    householdsServed: 40,
    coordinates: [12.5645, 76.7672],
    notes: 'Solar powered borewell tank near canal road',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'WT-06',
    name: {
      en: 'Kere Angala Open Well & Sump',
      kn: 'ಕೆರೆ ಅಂಗಳ ತೆರೆದ ಬಾವಿ ಮತ್ತು ಸಿಸ್ಟರ್ನ್',
    },
    ward: 'Ward 5',
    type: 'open well',
    capacity: 20000,
    yearBuilt: 2016,
    condition: 'good',
    lastCleaningDate: '2026-08-25',
    householdsServed: 55,
    coordinates: [12.5642, 76.7795],
    notes: 'Submersible pump with fenced masonry enclosure',
    dataSource: 'sample',
    isSample: true,
  },
];

// Generate 8 Sample Public Buildings near roads
const publicBuildings = [
  {
    id: 'PB-01',
    name: {
      en: 'Hulikere Gram Panchayat Office',
      kn: 'ಹುಲಿಕೆರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಕಾರ್ಯಾಲಯ',
    },
    ward: 'Ward 1',
    type: 'panchayat office',
    yearBuilt: 2014,
    condition: 'good',
    coordinates: [12.5710, 76.7732],
    notes: 'Main administrative building, PDO chamber & meeting hall',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-02',
    name: {
      en: 'Govt Higher Primary School (GHPS)',
      kn: 'ಸರ್ಕಾರಿ ಹಿರಿಯ ಪ್ರಾಥಮಿಕ ಶಾಲೆ',
    },
    ward: 'Ward 1',
    type: 'school',
    yearBuilt: 2008,
    condition: 'good',
    coordinates: [12.5702, 76.7720],
    notes: 'Classes 1 to 7, mid-day meal kitchen and playground',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-03',
    name: {
      en: 'Anganwadi Centre 1 (Main Village)',
      kn: 'ಅಂಗನವಾಡಿ ಕೇಂದ್ರ 1 (ಮುಖ್ಯ ಗ್ರಾಮ)',
    },
    ward: 'Ward 1',
    type: 'anganwadi',
    yearBuilt: 2012,
    condition: 'good',
    coordinates: [12.5695, 76.7739],
    notes: 'Early childhood care & supplementary nutrition center',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-04',
    name: {
      en: 'Primary Health Sub-Centre (HWC)',
      kn: 'ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಉಪಕೇಂದ್ರ (ಆರೋಗ್ಯ ಮತ್ತು ಕ್ಷೇಮ ಕೇಂದ್ರ)',
    },
    ward: 'Ward 1',
    type: 'hospital',
    yearBuilt: 2016,
    condition: 'good',
    coordinates: [12.5718, 76.7745],
    notes: 'ANM clinic, immunization and basic outpatient care',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-05',
    name: {
      en: 'Hulikere Koppalu Anganwadi Centre 2',
      kn: 'ಹುಲಿಕೆರೆ ಕೊಪ್ಪಲು ಅಂಗನವಾಡಿ ಕೇಂದ್ರ 2',
    },
    ward: 'Ward 2',
    type: 'anganwadi',
    yearBuilt: 2011,
    condition: 'poor',
    coordinates: [12.5762, 76.7790],
    notes: 'Roof waterproofing repair required, minor wall dampness',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-06',
    name: {
      en: 'Doddakeri Community Hall (Samudaya Bhavana)',
      kn: 'ದೊಡ್ಡಕೇರಿ ಸಮುದಾಯ ಭವನ',
    },
    ward: 'Ward 3',
    type: 'community hall',
    yearBuilt: 2019,
    condition: 'fair',
    coordinates: [12.5752, 76.7672],
    notes: 'Civic functions and SHG federation gatherings',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-07',
    name: {
      en: 'Dr. B.R. Ambedkar Bhavan (Canal Layout)',
      kn: 'ಡಾ. ಬಿ.ಆರ್. ಅಂಬೇಡ್ಕರ್ ಭವನ',
    },
    ward: 'Ward 4',
    type: 'community hall',
    yearBuilt: 2020,
    condition: 'good',
    coordinates: [12.5638, 76.7680],
    notes: 'Public library and village reading room',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'PB-08',
    name: {
      en: 'Sri Basaveshwara Swamy Temple',
      kn: 'ಶ್ರೀ ಬಸವೇಶ್ವರ ಸ್ವಾಮಿ ದೇವಸ್ಥಾನ',
    },
    ward: 'Ward 5',
    type: 'temple',
    yearBuilt: 2005,
    condition: 'good',
    coordinates: [12.5650, 76.7788],
    notes: 'Village temple and festival congregation ground',
    dataSource: 'sample',
    isSample: true,
  },
];

// Fallback sample roads in case OSM roads are ever cleared
const sampleRoads = [
  {
    id: 'RD-01',
    name: {
      en: 'Hulikere Gramatana Main Road',
      kn: 'ಹುಲಿಕೆರೆ ಗ್ರಾಮಠಾಣಾ ಮುಖ್ಯ ರಸ್ತೆ',
    },
    ward: 'Ward 1',
    type: 'CC',
    length: 520,
    width: 5.5,
    condition: 'good',
    lastRepaired: '2024-02-10',
    coordinates: [
      [12.5702, 76.7715],
      [12.5706, 76.7735],
      [12.5714, 76.7755],
    ],
    notes: 'Cement concrete road through central village market',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'RD-02',
    name: {
      en: 'School Link Road',
      kn: 'ಶಾಲೆ ಸಂಪರ್ಕ ರಸ್ತೆ',
    },
    ward: 'Ward 1',
    type: 'tar',
    length: 380,
    width: 4.5,
    condition: 'fair',
    lastRepaired: '2023-08-15',
    coordinates: [
      [12.5706, 76.7735],
      [12.5700, 76.7722],
      [12.5694, 76.7718],
    ],
    notes: 'Bitumen surface, slight edge wear near school gate',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'RD-03',
    name: {
      en: 'Hulikere Koppalu Cross Road',
      kn: 'ಹುಲಿಕೆರೆ ಕೊಪ್ಪಲು ಕ್ರಾಸ್ ರಸ್ತೆ',
    },
    ward: 'Ward 2',
    type: 'tar',
    length: 640,
    width: 5.0,
    condition: 'good',
    lastRepaired: '2024-01-20',
    coordinates: [
      [12.5714, 76.7755],
      [12.5742, 76.7778],
      [12.5768, 76.7802],
    ],
    notes: 'Connects Ward 1 core to Hulikere Koppalu',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'RD-04',
    name: {
      en: 'Doddakeri Western Approach Road',
      kn: 'ದೊಡ್ಡಕೇರಿ ಪಶ್ಚಿಮ ಸಂಪರ್ಕ ರಸ್ತೆ',
    },
    ward: 'Ward 3',
    type: 'WBM',
    length: 490,
    width: 4.0,
    condition: 'poor',
    lastRepaired: '2022-11-05',
    coordinates: [
      [12.5706, 76.7735],
      [12.5732, 76.7702],
      [12.5758, 76.7668],
    ],
    notes: 'Potholes along 150m stretch near agricultural fields',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'RD-05',
    name: {
      en: 'Visvesvaraya Canal Bank Road',
      kn: 'ವಿಶ್ವೇಶ್ವರಯ್ಯ ನಾಲೆ ದಂಡೆ ರಸ್ತೆ',
    },
    ward: 'Ward 4',
    type: 'tar',
    length: 780,
    width: 5.5,
    condition: 'good',
    lastRepaired: '2023-12-14',
    coordinates: [
      [12.5702, 76.7715],
      [12.5668, 76.7690],
      [12.5630, 76.7662],
    ],
    notes: 'Paved inspection road along the historic irrigation canal',
    dataSource: 'sample',
    isSample: true,
  },
  {
    id: 'RD-06',
    name: {
      en: 'Kere Angala Lake Bund Road',
      kn: 'ಕೆರೆ ಅಂಗಳ ಏರಿ ರಸ್ತೆ',
    },
    ward: 'Ward 5',
    type: 'kaccha',
    length: 510,
    width: 3.5,
    condition: 'fair',
    lastRepaired: '2023-05-18',
    coordinates: [
      [12.5702, 76.7715],
      [12.5672, 76.7752],
      [12.5640, 76.7792],
    ],
    notes: 'Gravel and mud road requiring pitching reinforcement',
    dataSource: 'sample',
    isSample: true,
  },
];

const complaints = [
  {
    id: 'CMP-2026-001',
    assetId: 'SL-04',
    assetType: 'streetLight',
    date: '2026-10-28',
    description: 'Street light not working for 4 days near Main Road junction',
    status: 'Open',
    reportedBy: 'K. Raju (Ward 1)',
    phone: '9845012345',
    coordinates: streetLights[3].coordinates,
    photoId: null,
  },
  {
    id: 'CMP-2026-002',
    assetId: 'WT-02',
    assetType: 'waterTank',
    date: '2026-11-02',
    description: 'Mini water tank inlet pipe valve leaking, water wasting continuously',
    status: 'In Progress',
    reportedBy: 'Suma Patel',
    phone: '9880123456',
    coordinates: waterTanks[1].coordinates,
    photoId: null,
  },
  {
    id: 'CMP-2026-003',
    assetId: 'SL-11',
    assetType: 'streetLight',
    date: '2026-11-06',
    description: 'Flickering street light pole near school entrance',
    status: 'Open',
    reportedBy: 'Basavaraju M.',
    phone: '9900234567',
    coordinates: streetLights[10].coordinates,
    photoId: null,
  },
  {
    id: 'CMP-2026-004',
    assetId: 'PB-05',
    assetType: 'publicBuilding',
    date: '2026-11-09',
    description: 'Roof seepage and peeling plaster at Anganwadi Centre 2',
    status: 'Open',
    reportedBy: 'Girijamma (Worker)',
    phone: '9448345678',
    coordinates: publicBuildings[4].coordinates,
    photoId: null,
  },
];

const newAssets = {
  meta: {
    panchayat: 'Hulikere Gram Panchayat',
    panchayatKn: 'ಹುಲಿಕೆರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ',
    taluk: 'Mandya',
    district: 'Mandya',
    state: 'Karnataka',
    center: [centerLat, centerLng],
    radiusKm: 1.5,
    bbox: [south, west, north, east],
    isSampleData: true,
  },
  wards,
  waterTanks,
  roads: sampleRoads,
  publicBuildings,
  streetLights,
  complaints,
};

await fs.writeFile(assetsPath, JSON.stringify(newAssets, null, 2), 'utf8');
console.log(`\nSuccessfully updated ${assetsPath}!`);

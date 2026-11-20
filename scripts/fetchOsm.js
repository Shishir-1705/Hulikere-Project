/**
 * Fetch real OpenStreetMap (OSM) infrastructure data for Hulikere village,
 * Mandya taluk, Mandya district, Karnataka using Overpass API with mirror fallback.
 *
 * Configurable centre and radius (default: 2 km).
 *
 * Usage:
 *   node scripts/fetchOsm.js
 *   npm run fetch:osm
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Easily editable center & radius configuration.
 * Coordinates verified at Hulikere village (OSM place=village node 3211036616).
 */
export const CONFIG = {
  overpassUrls: [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ],
  villageName: 'Hulikere',
  districtName: 'Mandya',
  stateName: 'Karnataka',
  // Village centre coordinates
  centerLat: 12.57056,
  centerLng: 76.77363,
  radiusKm: 2.0, // 2 km radius
  outputPath: path.resolve(__dirname, '../src/data/osm.json'),
  timeoutSeconds: 45,
};

/**
 * Computes bounding box [south, west, north, east] from center and radius in km.
 */
export function getBoundingBox(
  lat = CONFIG.centerLat,
  lng = CONFIG.centerLng,
  radiusKm = CONFIG.radiusKm
) {
  const kmPerLat = 111.132;
  const kmPerLng = 111.32 * Math.cos((lat * Math.PI) / 180);
  const deltaLat = radiusKm / kmPerLat;
  const deltaLng = radiusKm / kmPerLng;

  return [
    Number((lat - deltaLat).toFixed(6)), // south
    Number((lng - deltaLng).toFixed(6)), // west
    Number((lat + deltaLat).toFixed(6)), // north
    Number((lng + deltaLng).toFixed(6)), // east
  ];
}

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polylineLengthMeters(coords) {
  let len = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    len += haversineMeters(
      coords[i][1],
      coords[i][0],
      coords[i + 1][1],
      coords[i + 1][0]
    );
  }
  return len;
}

// Cohen-Sutherland line segment clipping against [south, west, north, east]
const INSIDE = 0;
const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;

function computeOutCode(x, y, xMin, yMin, xMax, yMax) {
  let code = INSIDE;
  if (x < xMin) code |= LEFT;
  else if (x > xMax) code |= RIGHT;
  if (y < yMin) code |= BOTTOM;
  else if (y > yMax) code |= TOP;
  return code;
}

function clipSegment(p0, p1, xMin, yMin, xMax, yMax) {
  let [x0, y0] = p0;
  let [x1, y1] = p1;
  let code0 = computeOutCode(x0, y0, xMin, yMin, xMax, yMax);
  let code1 = computeOutCode(x1, y1, xMin, yMin, xMax, yMax);
  let accept = false;

  for (let iter = 0; iter < 10; iter++) {
    if ((code0 | code1) === 0) {
      accept = true;
      break;
    } else if ((code0 & code1) !== 0) {
      break;
    } else {
      const codeOut = code0 !== 0 ? code0 : code1;
      let x = 0;
      let y = 0;

      if (codeOut & TOP) {
        x = x0 + ((x1 - x0) * (yMax - y0)) / (y1 - y0);
        y = yMax;
      } else if (codeOut & BOTTOM) {
        x = x0 + ((x1 - x0) * (yMin - y0)) / (y1 - y0);
        y = yMin;
      } else if (codeOut & RIGHT) {
        y = y0 + ((y1 - y0) * (xMax - x0)) / (x1 - x0);
        x = xMax;
      } else if (codeOut & LEFT) {
        y = y0 + ((y1 - y0) * (xMin - x0)) / (x1 - x0);
        x = xMin;
      }

      if (codeOut === code0) {
        x0 = x;
        y0 = y;
        code0 = computeOutCode(x0, y0, xMin, yMin, xMax, yMax);
      } else {
        x1 = x;
        y1 = y;
        code1 = computeOutCode(x1, y1, xMin, yMin, xMax, yMax);
      }
    }
  }

  if (accept) {
    return [
      [Number(x0.toFixed(7)), Number(y0.toFixed(7))],
      [Number(x1.toFixed(7)), Number(y1.toFixed(7))],
    ];
  }
  return null;
}

function clipPolylineToBbox(coords, bbox) {
  const [south, west, north, east] = bbox;
  const xMin = west;
  const xMax = east;
  const yMin = south;
  const yMax = north;

  const clippedLines = [];
  let currentLine = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const seg = clipSegment(coords[i], coords[i + 1], xMin, yMin, xMax, yMax);
    if (!seg) {
      if (currentLine.length >= 2) {
        clippedLines.push(currentLine);
      }
      currentLine = [];
      continue;
    }

    const [cp0, cp1] = seg;
    if (currentLine.length === 0) {
      currentLine.push(cp0, cp1);
    } else {
      const lastPt = currentLine[currentLine.length - 1];
      const dist = Math.hypot(lastPt[0] - cp0[0], lastPt[1] - cp0[1]);
      if (dist < 1e-6) {
        currentLine.push(cp1);
      } else {
        if (currentLine.length >= 2) {
          clippedLines.push(currentLine);
        }
        currentLine = [cp0, cp1];
      }
    }
  }

  if (currentLine.length >= 2) {
    clippedLines.push(currentLine);
  }

  // Filter out tiny sliver segments (< 20 meters)
  return clippedLines.filter((line) => polylineLengthMeters(line) >= 20);
}

function buildBroadQuery(bboxStr, timeoutSeconds) {
  return `
[out:json][timeout:${timeoutSeconds}];
(
  // Roads: all highway except motorway, plus tracks and paths
  way["highway"]["highway"!="motorway"]["highway"!="motorway_link"](${bboxStr});

  // Public buildings & amenities
  nwr["amenity"~"^(school|kindergarten|college|clinic|hospital|doctors|pharmacy|community_centre|townhall|post_office|library|bank|marketplace|police|place_of_worship)$"](${bboxStr});
  nwr["building"~"^(school|temple|mosque|church|government|public)$"](${bboxStr});
  nwr["office"~"^(government|administrative)$"](${bboxStr});
  nwr["government"](${bboxStr});

  // Water structures & bodies
  nwr["man_made"~"^(water_tower|water_well|storage_tank|water_tap|pumping_station)$"](${bboxStr});
  nwr["natural"="water"](${bboxStr});
  nwr["landuse"="reservoir"](${bboxStr});
  nwr["amenity"="drinking_water"](${bboxStr});

  // Street lights
  node["highway"="street_lamp"](${bboxStr});
  node["lamp_type"](${bboxStr});

  // Building=yes (houses/structures to count)
  nwr["building"="yes"](${bboxStr});
);
out center geom;
`.trim();
}

async function queryOverpassWithMirrors(ql) {
  for (const url of CONFIG.overpassUrls) {
    try {
      console.log(`Connecting to Overpass endpoint: ${url}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': 'HulikereBroadOsmImporter/2.0',
        },
        body: `data=${encodeURIComponent(ql)}`,
      });

      if (response.ok) {
        return await response.json();
      }
      console.warn(`Endpoint ${url} returned status ${response.status} ${response.statusText}`);
    } catch (err) {
      console.warn(`Failed connecting to ${url}: ${err.message}`);
    }
  }

  throw new Error('All Overpass API mirrors failed or timed out.');
}

function classifyElement(tags = {}) {
  const hw = tags.highway;
  const mm = tags.man_made;
  const nat = tags.natural;
  const lu = tags.landuse;
  const amenity = tags.amenity;
  const bldg = tags.building;

  if (hw === 'street_lamp' || tags.lamp_type) {
    return 'streetLight';
  }

  if (
    mm === 'water_tower' ||
    mm === 'water_well' ||
    mm === 'storage_tank' ||
    mm === 'water_tap' ||
    mm === 'pumping_station' ||
    amenity === 'drinking_water' ||
    nat === 'water' ||
    lu === 'reservoir'
  ) {
    return 'waterTank';
  }

  if (
    amenity ||
    ['school', 'temple', 'mosque', 'church', 'government', 'public'].includes(bldg) ||
    tags.office ||
    tags.government
  ) {
    return 'publicBuilding';
  }

  if (bldg === 'yes') {
    return 'houseCount';
  }

  if (hw && hw !== 'motorway' && hw !== 'motorway_link') {
    return 'road';
  }

  return null;
}

function isClosedRing(coords) {
  if (coords.length < 4) return false;
  const first = coords[0];
  const last = coords[coords.length - 1];
  return first[0] === last[0] && first[1] === last[1];
}

function elementToGeometry(el, category, bbox) {
  const [south, west, north, east] = bbox;

  if (el.type === 'node' && typeof el.lon === 'number' && typeof el.lat === 'number') {
    if (el.lat < south || el.lat > north || el.lon < west || el.lon > east) return null;
    return {
      type: 'Point',
      coordinates: [el.lon, el.lat],
    };
  }

  if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length > 0) {
    const coords = el.geometry
      .filter((pt) => typeof pt.lon === 'number' && typeof pt.lat === 'number')
      .map((pt) => [pt.lon, pt.lat]);

    if (coords.length === 0) return null;

    if (category === 'road') {
      const clippedLines = clipPolylineToBbox(coords, bbox);
      if (clippedLines.length === 0) return null;
      return {
        type: 'ClippedLines',
        lines: clippedLines,
      };
    }

    if (isClosedRing(coords)) {
      return {
        type: 'Polygon',
        coordinates: [coords],
      };
    }

    if (coords.length >= 2) {
      return {
        type: 'LineString',
        coordinates: coords,
      };
    }

    return {
      type: 'Point',
      coordinates: coords[0],
    };
  }

  if (el.center && typeof el.center.lat === 'number' && typeof el.center.lon === 'number') {
    if (el.center.lat < south || el.center.lat > north || el.center.lon < west || el.center.lon > east) {
      return null;
    }
    return {
      type: 'Point',
      coordinates: [el.center.lon, el.center.lat],
    };
  }

  return null;
}

function getFeatureCenter(feature) {
  const g = feature.geometry;
  if (!g) return null;
  if (g.type === 'Point' && Array.isArray(g.coordinates)) {
    return [g.coordinates[1], g.coordinates[0]]; // [lat, lon]
  }
  if (g.type === 'LineString' && Array.isArray(g.coordinates) && g.coordinates.length > 0) {
    const mid = g.coordinates[Math.floor(g.coordinates.length / 2)];
    return [mid[1], mid[0]];
  }
  if (g.type === 'Polygon' && Array.isArray(g.coordinates?.[0]) && g.coordinates[0].length > 0) {
    const ring = g.coordinates[0];
    const avgLon = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const avgLat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return [avgLat, avgLon];
  }
  return null;
}

function pointInPolygon(lat, lng, polygon) {
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

function assignWard(lat, lng, wards = []) {
  for (const w of wards) {
    if (pointInPolygon(lat, lng, w.polygon)) {
      return w.ward;
    }
  }
  let bestWard = wards[0]?.ward || 'Ward 1';
  let bestDist = Infinity;
  for (const w of wards) {
    if (!Array.isArray(w.center) || w.center.length !== 2) continue;
    const d = haversineMeters(lat, lng, w.center[0], w.center[1]);
    if (d < bestDist) {
      bestDist = d;
      bestWard = w.ward;
    }
  }
  return bestWard;
}

export function deduplicateFeatures(features, thresholdMeters = 10) {
  const kept = [];
  const byCategory = {};

  for (const f of features) {
    const cat = f.properties.category;
    const center = getFeatureCenter(f);
    if (!center) {
      kept.push(f);
      continue;
    }

    if (!byCategory[cat]) byCategory[cat] = [];

    // Check if within thresholdMeters of an existing item in same category
    const isDuplicate = byCategory[cat].some((existing) => {
      const eCenter = getFeatureCenter(existing);
      if (!eCenter) return false;
      const d = haversineMeters(center[0], center[1], eCenter[0], eCenter[1]);
      return d < thresholdMeters;
    });

    if (!isDuplicate) {
      byCategory[cat].push(f);
      kept.push(f);
    }
  }

  return kept;
}

export function overpassToGeoJson(overpassJson, metaInfo, bbox, wards = []) {
  const elements = Array.isArray(overpassJson?.elements) ? overpassJson.elements : [];
  const rawFeatures = [];

  let houseCount = 0;
  const counts = {
    roads: 0,
    publicBuildings: 0,
    waterTanks: 0,
    streetLights: 0,
    residentialHouses: 0,
  };

  for (const el of elements) {
    const tags = el.tags || {};
    const category = classifyElement(tags);
    if (!category) continue;

    if (category === 'houseCount') {
      houseCount++;
      continue;
    }

    const geomResult = elementToGeometry(el, category, bbox);
    if (!geomResult) continue;

    const uniqueKey = `${el.type}/${el.id}`;

    if (category === 'road' && geomResult.type === 'ClippedLines') {
      geomResult.lines.forEach((lineCoords, idx) => {
        const lineId = geomResult.lines.length > 1 ? `${uniqueKey}_${idx + 1}` : uniqueKey;
        rawFeatures.push({
          type: 'Feature',
          id: lineId,
          properties: {
            osmId: lineId,
            osmType: el.type,
            category: 'road',
            name: tags.name || tags['name:en'] || null,
            nameKn: tags['name:kn'] || null,
            highway: tags.highway || null,
            surface: tags.surface || null,
            condition: 'Unknown',
            dataSource: 'osm',
            isSample: false,
            tags,
          },
          geometry: {
            type: 'LineString',
            coordinates: lineCoords,
          },
        });
      });
      continue;
    }

    rawFeatures.push({
      type: 'Feature',
      id: uniqueKey,
      properties: {
        osmId: uniqueKey,
        osmType: el.type,
        category,
        name: tags.name || tags['name:en'] || null,
        nameKn: tags['name:kn'] || null,
        highway: tags.highway || null,
        surface: tags.surface || null,
        amenity: tags.amenity || null,
        building: tags.building || null,
        office: tags.office || null,
        man_made: tags.man_made || null,
        natural: tags.natural || null,
        landuse: tags.landuse || null,
        condition: 'Unknown',
        dataSource: 'osm',
        isSample: false,
        tags,
      },
      geometry: geomResult,
    });
  }

  // Deduplicate features within 10 meters
  const deduplicatedFeatures = deduplicateFeatures(rawFeatures, 10);

  // Assign ID and Ward to each feature
  let roadSeq = 1;
  let pbSeq = 1;
  let wtSeq = 1;
  let slSeq = 1;

  for (const f of deduplicatedFeatures) {
    const c = f.properties.category;
    const center = getFeatureCenter(f);
    const ward = center ? assignWard(center[0], center[1], wards) : 'Ward 1';

    f.properties.ward = ward;
    f.properties.condition = 'Unknown';
    f.properties.dataSource = 'osm';
    f.properties.isSample = false;

    if (c === 'road') {
      const assetId = `OSM-RD-${String(roadSeq++).padStart(2, '0')}`;
      f.properties.id = assetId;
      counts.roads++;
    } else if (c === 'publicBuilding') {
      const assetId = `OSM-PB-${String(pbSeq++).padStart(2, '0')}`;
      f.properties.id = assetId;
      counts.publicBuildings++;
    } else if (c === 'waterTank') {
      const assetId = `OSM-WT-${String(wtSeq++).padStart(2, '0')}`;
      f.properties.id = assetId;
      counts.waterTanks++;
    } else if (c === 'streetLight') {
      const assetId = `OSM-SL-${String(slSeq++).padStart(2, '0')}`;
      f.properties.id = assetId;
      counts.streetLights++;
    }
  }
  counts.residentialHouses = houseCount;

  return {
    type: 'FeatureCollection',
    metadata: {
      ...metaInfo,
      counts: {
        total: deduplicatedFeatures.length,
        roads: counts.roads,
        publicBuildings: counts.publicBuildings,
        waterTanks: counts.waterTanks,
        streetLights: counts.streetLights,
        residentialHouses: counts.residentialHouses,
      },
    },
    features: deduplicatedFeatures,
  };
}

export async function fetchOsmData() {
  const bbox = getBoundingBox(CONFIG.centerLat, CONFIG.centerLng, CONFIG.radiusKm);
  console.log(`\n======================================================`);
  console.log(`Broad Overpass Fetch for ${CONFIG.villageName} Village`);
  console.log(`Center: [${CONFIG.centerLat}, ${CONFIG.centerLng}]`);
  console.log(`Radius: ${CONFIG.radiusKm} km`);
  console.log(`Bounding Box [S, W, N, E]: [${bbox.join(', ')}]`);
  console.log(`======================================================\n`);

  let wards = [];
  try {
    const assetsPath = path.resolve(__dirname, '../src/data/assets.json');
    const assetsRaw = await fs.readFile(assetsPath, 'utf8');
    const parsedAssets = JSON.parse(assetsRaw);
    wards = parsedAssets.wards || [];
  } catch (e) {
    console.warn('Could not load assets.json for ward assignment:', e.message);
  }

  const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  const ql = buildBroadQuery(bboxStr, CONFIG.timeoutSeconds);
  const overpassData = await queryOverpassWithMirrors(ql);

  const geoJson = overpassToGeoJson(
    overpassData,
    {
      fetchedAt: new Date().toISOString(),
      source: 'OpenStreetMap (Overpass API)',
      queryMethod: 'bbox-broad',
      village: CONFIG.villageName,
      district: CONFIG.districtName,
      center: [CONFIG.centerLat, CONFIG.centerLng],
      radiusKm: CONFIG.radiusKm,
      bbox,
    },
    bbox,
    wards
  );

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(geoJson, null, 2), 'utf8');

  const { counts } = geoJson.metadata;
  console.log('\n=== Overpass Broad Fetch Summary for Hulikere Village ===');
  console.log(`Total real features imported : ${counts.total}`);
  console.log(`Roads (clipped & deduplicated): ${counts.roads}`);
  console.log(`Public buildings & amenities  : ${counts.publicBuildings}`);
  console.log(`Water structures & bodies     : ${counts.waterTanks}`);
  console.log(`Street lights (OSM)           : ${counts.streetLights}`);
  console.log(`Residential houses (building=yes): ${counts.residentialHouses}`);
  console.log(`\nGeoJSON saved successfully to: ${CONFIG.outputPath}`);

  return geoJson;
}

// Execute when run as CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fetchOsmData().catch((err) => {
    console.error('Failed to fetch OSM data:', err.message);
    process.exitCode = 1;
  });
}

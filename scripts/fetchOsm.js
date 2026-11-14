/**
 * Fetch real OpenStreetMap (OSM) infrastructure data for Hulikere village,
 * Mandya taluk, Mandya district, Karnataka using the Overpass API with a configurable
 * bounding box centered on Hulikere village.
 *
 * All road geometries are clipped strictly to the village bounding box so no road
 * extends beyond it, and long highway segments leaving the area are clipped/trimmed.
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
 * Coordinates centered on Hulikere village, Mandya District (OSM node 3211036616).
 */
export const CONFIG = {
  overpassUrl: 'https://overpass-api.de/api/interpreter',
  villageName: 'Hulikere',
  districtName: 'Mandya',
  stateName: 'Karnataka',
  // Village centre coordinates
  centerLat: 12.57056,
  centerLng: 76.77363,
  radiusKm: 1.5,
  outputPath: path.resolve(__dirname, '../src/data/osm.json'),
  timeoutSeconds: 45,
};

/**
 * Computes bounding box [south, west, north, east] from center (lat, lng) and radius in km.
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

function haversineMeters(lat1, lon1, lat2, lon2) {
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

/**
 * Clips a polyline to bounding box.
 * Returns an array of clipped continuous polylines.
 */
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

function buildFeatureFilters(scopeClause) {
  return `
  way["highway"](${scopeClause});
  nwr["amenity"](${scopeClause});
  nwr["office"](${scopeClause});
  nwr["government"](${scopeClause});
  nwr["building"](${scopeClause});
  nwr["man_made"~"^(water_tower|water_tank|water_well|storage_tank)$"](${scopeClause});
`.trim();
}

function buildBboxQuery(bbox, timeoutSeconds) {
  const [south, west, north, east] = bbox;
  const bboxStr = `${south},${west},${north},${east}`;
  return `
[out:json][timeout:${timeoutSeconds}];
(
  ${buildFeatureFilters(bboxStr)}
);
out body geom;
`.trim();
}

async function queryOverpass(ql) {
  const response = await fetch(CONFIG.overpassUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json',
      'User-Agent': 'HulikereGramPanchayatAssetManager/1.0',
    },
    body: `data=${encodeURIComponent(ql)}`,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(
      `Overpass API HTTP ${response.status} ${response.statusText}: ${errText.slice(0, 200)}`
    );
  }

  return response.json();
}

/**
 * Filter roads: drop unnamed footpaths and tiny service lanes,
 * while keeping all residential, unclassified, tertiary, secondary, primary, and named roads.
 */
function shouldKeepRoad(tags = {}) {
  const highway = String(tags.highway || '').toLowerCase();
  const name = tags.name || tags['name:en'] || tags['name:kn'];

  // Drop unnamed footpaths, trails, steps, cycleways, tracks
  const pedestrianTypes = [
    'footway',
    'path',
    'steps',
    'cycleway',
    'pedestrian',
    'bridleway',
    'corridor',
  ];
  if (pedestrianTypes.includes(highway)) {
    if (!name) return false;
  }

  // Drop tiny service lanes (driveways, parking aisles, alleys)
  if (highway === 'service') {
    const serviceType = String(tags.service || '').toLowerCase();
    if (['driveway', 'parking_aisle', 'alley'].includes(serviceType)) {
      return false;
    }
    if (!name && serviceType === '') {
      return false;
    }
  }

  return true;
}

function classifyElement(tags = {}) {
  const manMade = String(tags.man_made || '').toLowerCase();
  if (
    manMade === 'water_tower' ||
    manMade === 'water_tank' ||
    manMade === 'water_well' ||
    manMade === 'storage_tank'
  ) {
    return 'waterTank';
  }

  if (tags.highway) {
    if (!shouldKeepRoad(tags)) {
      return null;
    }
    return 'road';
  }

  if (tags.amenity || tags.office || tags.government || tags.building) {
    return 'publicBuilding';
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
  if (el.type === 'node' && typeof el.lon === 'number' && typeof el.lat === 'number') {
    const [south, west, north, east] = bbox;
    if (el.lat < south || el.lat > north || el.lon < west || el.lon > east) {
      return null;
    }
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

  return null;
}

function overpassToGeoJson(overpassJson, metaInfo, bbox) {
  const elements = Array.isArray(overpassJson?.elements)
    ? overpassJson.elements
    : [];

  const seenKeys = new Set();
  const features = [];
  const counts = {
    roads: 0,
    publicBuildings: 0,
    waterTanks: 0,
    droppedRoads: 0,
    buildingsBreakdown: {
      school: 0,
      anganwadi: 0,
      hospitalOrClinic: 0,
      communityCentre: 0,
      temple: 0,
      panchayatOrGovtOffice: 0,
      otherNamedBuilding: 0,
    },
    waterBreakdown: {
      water_tower: 0,
      water_tank: 0,
      water_well: 0,
    },
  };

  for (const el of elements) {
    const tags = el.tags || {};
    if (tags.highway && !shouldKeepRoad(tags)) {
      counts.droppedRoads += 1;
      continue;
    }

    const category = classifyElement(tags);
    if (!category) continue;

    const uniqueKey = `${el.type}/${el.id}`;
    if (seenKeys.has(uniqueKey)) continue;
    seenKeys.add(uniqueKey);

    const geomResult = elementToGeometry(el, category, bbox);
    if (!geomResult) continue;

    if (category === 'road' && geomResult.type === 'ClippedLines') {
      geomResult.lines.forEach((lineCoords, idx) => {
        counts.roads += 1;
        const lineId = geomResult.lines.length > 1 ? `${uniqueKey}_${idx + 1}` : uniqueKey;
        features.push({
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
            amenity: tags.amenity || null,
            building: tags.building || null,
            office: tags.office || null,
            man_made: tags.man_made || null,
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

    if (category === 'waterTank') {
      counts.waterTanks += 1;
      const mm = String(tags.man_made || '').toLowerCase();
      if (mm === 'water_tower') counts.waterBreakdown.water_tower += 1;
      else if (mm === 'water_well') counts.waterBreakdown.water_well += 1;
      else counts.waterBreakdown.water_tank += 1;
    } else if (category === 'publicBuilding') {
      counts.publicBuildings += 1;
      const amenity = String(tags.amenity || '').toLowerCase();
      const bldg = String(tags.building || '').toLowerCase();
      const office = String(tags.office || '').toLowerCase();
      const nameLower = String(tags.name || '').toLowerCase();

      if (amenity === 'school' || bldg === 'school' || nameLower.includes('school')) {
        counts.buildingsBreakdown.school += 1;
      } else if (
        amenity === 'kindergarten' ||
        bldg === 'kindergarten' ||
        nameLower.includes('anganwadi')
      ) {
        counts.buildingsBreakdown.anganwadi += 1;
      } else if (
        amenity === 'hospital' ||
        amenity === 'clinic' ||
        amenity === 'doctors' ||
        bldg === 'hospital' ||
        bldg === 'clinic' ||
        nameLower.includes('phc') ||
        nameLower.includes('hospital') ||
        nameLower.includes('clinic')
      ) {
        counts.buildingsBreakdown.hospitalOrClinic += 1;
      } else if (
        amenity === 'community_centre' ||
        amenity === 'social_facility' ||
        nameLower.includes('community') ||
        nameLower.includes('bhavan')
      ) {
        counts.buildingsBreakdown.communityCentre += 1;
      } else if (
        amenity === 'place_of_worship' ||
        bldg === 'temple' ||
        nameLower.includes('temple') ||
        nameLower.includes('devasthana')
      ) {
        counts.buildingsBreakdown.temple += 1;
      } else if (
        office === 'government' ||
        office === 'administrative' ||
        tags.government ||
        amenity === 'townhall' ||
        bldg === 'government' ||
        bldg === 'public' ||
        bldg === 'civic' ||
        nameLower.includes('panchayat')
      ) {
        counts.buildingsBreakdown.panchayatOrGovtOffice += 1;
      } else {
        counts.buildingsBreakdown.otherNamedBuilding += 1;
      }
    }

    features.push({
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
        tags,
      },
      geometry: geomResult,
    });
  }

  return {
    type: 'FeatureCollection',
    metadata: {
      ...metaInfo,
      counts: {
        total: features.length,
        roads: counts.roads,
        droppedRoads: counts.droppedRoads,
        publicBuildings: counts.publicBuildings,
        waterTanks: counts.waterTanks,
        buildingsBreakdown: counts.buildingsBreakdown,
        waterBreakdown: counts.waterBreakdown,
      },
    },
    features,
  };
}

export async function fetchOsmData() {
  const bbox = getBoundingBox(CONFIG.centerLat, CONFIG.centerLng, CONFIG.radiusKm);
  console.log(`\n======================================================`);
  console.log(`Fetching OpenStreetMap data for ${CONFIG.villageName} village`);
  console.log(`Center: [${CONFIG.centerLat}, ${CONFIG.centerLng}]`);
  console.log(`Radius: ${CONFIG.radiusKm} km`);
  console.log(`Bounding Box [S, W, N, E]: [${bbox.join(', ')}]`);
  console.log(`======================================================\n`);

  const ql = buildBboxQuery(bbox, CONFIG.timeoutSeconds);
  const overpassData = await queryOverpass(ql);

  if (overpassData.remark) {
    console.warn(`Overpass remark: ${overpassData.remark}`);
  }

  const geoJson = overpassToGeoJson(
    overpassData,
    {
      fetchedAt: new Date().toISOString(),
      source: 'OpenStreetMap (Overpass API)',
      queryMethod: 'bbox',
      village: CONFIG.villageName,
      district: CONFIG.districtName,
      center: [CONFIG.centerLat, CONFIG.centerLng],
      radiusKm: CONFIG.radiusKm,
      bbox,
    },
    bbox
  );

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(geoJson, null, 2), 'utf8');

  const { counts } = geoJson.metadata;
  console.log('\n=== Overpass Fetch Summary for Hulikere Village ===');
  console.log(`Total valid features : ${counts.total}`);
  console.log(`Roads (clipped)      : ${counts.roads}`);
  console.log(`Roads/paths (dropped): ${counts.droppedRoads}`);
  console.log(`Public buildings     : ${counts.publicBuildings}`);
  console.log(`Water structures     : ${counts.waterTanks}`);
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

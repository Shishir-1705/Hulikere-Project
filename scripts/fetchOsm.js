/**
 * Fetch real OpenStreetMap (OSM) infrastructure data for Hulikere village,
 * Mandya district, Karnataka using the Overpass API and convert it to GeoJSON.
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
 * Editable configuration for Overpass query & fallback bounding box.
 * fallbackBbox format: [south, west, north, east]
 */
export const CONFIG = {
  overpassUrl: 'https://overpass-api.de/api/interpreter',
  districtName: 'Mandya',
  villageName: 'Hulikere',
  fallbackBbox: [12.505, 76.885, 12.535, 76.915],
  outputPath: path.resolve(__dirname, '../src/data/osm.json'),
  timeoutSeconds: 30,
};

function buildFeatureFilters(scopeClause) {
  return `
  way["highway"](${scopeClause});
  nwr["amenity"~"^(school|kindergarten|hospital|clinic|doctors|community_centre|social_facility|place_of_worship|townhall)$"](${scopeClause});
  nwr["office"~"^(government|administrative)$"](${scopeClause});
  nwr["government"](${scopeClause});
  nwr["building"~"^(school|kindergarten|hospital|clinic|civic|public|government|temple|chapel|church|mosque|hall)$"](${scopeClause});
  nwr["building"]["name"](${scopeClause});
  nwr["man_made"~"^(water_tower|water_tank|water_well|storage_tank)$"](${scopeClause});
`.trim();
}

function buildAreaQuery(districtName, villageName, timeoutSeconds) {
  return `
[out:json][timeout:${timeoutSeconds}];
area["name"~"${districtName}",i]["boundary"="administrative"]->.district;
(
  rel["name"~"^${villageName}$",i]["boundary"="administrative"](area.district);
  rel["name:en"~"^${villageName}$",i]["boundary"="administrative"](area.district);
  rel["name"~"^${villageName}$",i]["place"](area.district);
);
map_to_area->.searchArea;
(
  ${buildFeatureFilters('area.searchArea')}
);
out body geom;
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
    return 'road';
  }

  if (
    tags.amenity ||
    tags.office ||
    tags.government ||
    tags.building
  ) {
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

function elementToGeometry(el, category) {
  if (el.type === 'node' && typeof el.lon === 'number' && typeof el.lat === 'number') {
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
      if (coords.length < 2) return null;
      return {
        type: 'LineString',
        coordinates: coords,
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

  if (el.type === 'relation' && Array.isArray(el.members)) {
    const outerRings = [];
    const fallbackPoints = [];

    for (const member of el.members) {
      if (!Array.isArray(member.geometry) || member.geometry.length === 0) continue;
      const ring = member.geometry
        .filter((pt) => typeof pt.lon === 'number' && typeof pt.lat === 'number')
        .map((pt) => [pt.lon, pt.lat]);
      if (ring.length === 0) continue;
      fallbackPoints.push(...ring);
      if (member.role === 'outer' && isClosedRing(ring)) {
        outerRings.push(ring);
      }
    }

    if (outerRings.length > 0) {
      return {
        type: 'Polygon',
        coordinates: [outerRings[0]],
      };
    }

    if (fallbackPoints.length > 0) {
      const avgLon =
        fallbackPoints.reduce((s, p) => s + p[0], 0) / fallbackPoints.length;
      const avgLat =
        fallbackPoints.reduce((s, p) => s + p[1], 0) / fallbackPoints.length;
      return {
        type: 'Point',
        coordinates: [Number(avgLon.toFixed(6)), Number(avgLat.toFixed(6))],
      };
    }
  }

  return null;
}

function overpassToGeoJson(overpassJson, metaInfo) {
  const elements = Array.isArray(overpassJson?.elements)
    ? overpassJson.elements
    : [];

  const seenKeys = new Set();
  const features = [];
  const counts = {
    roads: 0,
    publicBuildings: 0,
    waterTanks: 0,
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
    const category = classifyElement(tags);
    if (!category) continue;

    const uniqueKey = `${el.type}/${el.id}`;
    if (seenKeys.has(uniqueKey)) continue;
    seenKeys.add(uniqueKey);

    const geometry = elementToGeometry(el, category);
    if (!geometry) continue;

    if (category === 'road') {
      counts.roads += 1;
    } else if (category === 'waterTank') {
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
      geometry,
    });
  }

  return {
    type: 'FeatureCollection',
    metadata: {
      ...metaInfo,
      counts: {
        total: features.length,
        roads: counts.roads,
        publicBuildings: counts.publicBuildings,
        waterTanks: counts.waterTanks,
        buildingsBreakdown: counts.buildingsBreakdown,
        waterBreakdown: counts.waterBreakdown,
      },
    },
    features,
  };
}

async function main() {
  console.log(
    `Querying Overpass API for "${CONFIG.villageName}" in "${CONFIG.districtName}" district...`
  );

  let queryMethod = 'area';
  let overpassData = await queryOverpass(
    buildAreaQuery(CONFIG.districtName, CONFIG.villageName, CONFIG.timeoutSeconds)
  );

  if (overpassData.remark) {
    console.warn(`Overpass area query remark: ${overpassData.remark}`);
  }

  if (!Array.isArray(overpassData.elements) || overpassData.elements.length === 0) {
    console.log(
      `Area lookup returned 0 elements. Falling back to bounding box [${CONFIG.fallbackBbox.join(
        ', '
      )}]...`
    );
    queryMethod = 'bbox';
    overpassData = await queryOverpass(
      buildBboxQuery(CONFIG.fallbackBbox, CONFIG.timeoutSeconds)
    );
  }

  const geoJson = overpassToGeoJson(overpassData, {
    fetchedAt: new Date().toISOString(),
    source: 'OpenStreetMap (Overpass API)',
    queryMethod,
    village: CONFIG.villageName,
    district: CONFIG.districtName,
    bbox: CONFIG.fallbackBbox,
  });

  await fs.mkdir(path.dirname(CONFIG.outputPath), { recursive: true });
  await fs.writeFile(CONFIG.outputPath, JSON.stringify(geoJson, null, 2), 'utf8');

  const { counts } = geoJson.metadata;
  console.log('\n=== Overpass Fetch Summary ===');
  console.log(`Query method    : ${queryMethod}`);
  console.log(`Total features  : ${counts.total}`);
  console.log(`Roads (highway) : ${counts.roads}`);
  console.log(`Public buildings: ${counts.publicBuildings}`);
  console.log(`  - Schools     : ${counts.buildingsBreakdown.school}`);
  console.log(`  - Anganwadis  : ${counts.buildingsBreakdown.anganwadi}`);
  console.log(`  - PHC/Clinic  : ${counts.buildingsBreakdown.hospitalOrClinic}`);
  console.log(`  - Community   : ${counts.buildingsBreakdown.communityCentre}`);
  console.log(`  - Temples     : ${counts.buildingsBreakdown.temple}`);
  console.log(`  - Govt/GP Off.: ${counts.buildingsBreakdown.panchayatOrGovtOffice}`);
  console.log(`  - Other named : ${counts.buildingsBreakdown.otherNamedBuilding}`);
  console.log(`Water structures: ${counts.waterTanks}`);
  console.log(`  - water_tower : ${counts.waterBreakdown.water_tower}`);
  console.log(`  - water_tank  : ${counts.waterBreakdown.water_tank}`);
  console.log(`  - water_well  : ${counts.waterBreakdown.water_well}`);
  console.log(`\nSaved GeoJSON to: ${CONFIG.outputPath}`);
}

main().catch((err) => {
  console.error('Failed to fetch OSM data:', err.message);
  process.exitCode = 1;
});

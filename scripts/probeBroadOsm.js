import fs from 'node:fs/promises';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const centerLat = 12.57056;
const centerLng = 76.77363;
const radiusKm = 2.0;

const kmPerLat = 111.132;
const kmPerLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
const deltaLat = radiusKm / kmPerLat;
const deltaLng = radiusKm / kmPerLng;

const bbox = [
  Number((centerLat - deltaLat).toFixed(6)),
  Number((centerLng - deltaLng).toFixed(6)),
  Number((centerLat + deltaLat).toFixed(6)),
  Number((centerLng + deltaLng).toFixed(6)),
];

console.log('Bounding box for 2km radius:', bbox);
const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;

const ql = `
[out:json][timeout:45];
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
`;

async function query() {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying ${url}...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'HulikereBroadOsmProbe/1.0',
        },
        body: `data=${encodeURIComponent(ql)}`,
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`Endpoint ${url} failed with ${res.status}`);
    } catch (e) {
      console.warn(`Endpoint ${url} network error: ${e.message}`);
    }
  }
  throw new Error('All endpoints failed');
}

async function main() {
  const data = await query();
  console.log(`Received ${data.elements?.length || 0} total elements.\n`);

  const breakdown = {
    roads: [],
    publicBuildings: [],
    waterStructures: [],
    waterBodies: [],
    streetLamps: [],
    residentialHouses: 0,
    other: [],
  };

  for (const el of data.elements || []) {
    const tags = el.tags || {};
    const hw = tags.highway;
    const amenity = tags.amenity;
    const bldg = tags.building;
    const mm = tags.man_made;
    const nat = tags.natural;
    const lu = tags.landuse;

    if (hw === 'street_lamp' || tags.lamp_type) {
      breakdown.streetLamps.push(el);
    } else if (mm || amenity === 'drinking_water') {
      breakdown.waterStructures.push(el);
    } else if (nat === 'water' || lu === 'reservoir') {
      breakdown.waterBodies.push(el);
    } else if (
      amenity ||
      ['school', 'temple', 'mosque', 'church', 'government', 'public'].includes(bldg) ||
      tags.office ||
      tags.government
    ) {
      breakdown.publicBuildings.push(el);
    } else if (bldg === 'yes') {
      breakdown.residentialHouses++;
    } else if (hw) {
      breakdown.roads.push(el);
    } else {
      breakdown.other.push(el);
    }
  }

  console.log('=== OVERPASS 2KM QUERY RESULTS ===');
  console.log(`Roads (highway=*)                : ${breakdown.roads.length}`);
  console.log(`Public Buildings & Amenities     : ${breakdown.publicBuildings.length}`);
  console.log(`Water Structures (tanks/wells/tap): ${breakdown.waterStructures.length}`);
  console.log(`Water Bodies (kere/reservoir)    : ${breakdown.waterBodies.length}`);
  console.log(`Street Lamps (highway=street_lamp): ${breakdown.streetLamps.length}`);
  console.log(`Residential Houses (building=yes): ${breakdown.residentialHouses}`);
  console.log(`Other elements                   : ${breakdown.other.length}`);

  if (breakdown.publicBuildings.length > 0) {
    console.log('\nPublic Buildings details:');
    breakdown.publicBuildings.forEach(b => console.log(' -', b.type, b.id, b.tags));
  }
  if (breakdown.waterStructures.length > 0) {
    console.log('\nWater structures details:');
    breakdown.waterStructures.forEach(w => console.log(' -', w.type, w.id, w.tags));
  }
  if (breakdown.waterBodies.length > 0) {
    console.log('\nWater bodies details:');
    breakdown.waterBodies.forEach(w => console.log(' -', w.type, w.id, w.tags));
  }
}

main().catch(console.error);

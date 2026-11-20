import fs from 'node:fs/promises';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const centerLat = 12.57056;
const centerLng = 76.77363;
const radiusMeters = 3000;

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

async function queryOverpass(ql) {
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      console.log(`Querying ${url}...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'HulikereLocationVerifier/1.0',
        },
        body: `data=${encodeURIComponent(ql)}`,
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`Endpoint ${url} failed with status: ${res.status}`);
    } catch (err) {
      console.warn(`Endpoint ${url} network error: ${err.message}`);
    }
  }
  throw new Error('All Overpass endpoints failed.');
}

async function main() {
  const ql = `
[out:json][timeout:25];
(
  node(around:${radiusMeters}, ${centerLat}, ${centerLng})["place"];
  way(around:${radiusMeters}, ${centerLat}, ${centerLng})["place"];
  rel(around:${radiusMeters}, ${centerLat}, ${centerLng})["place"];
  node(around:${radiusMeters}, ${centerLat}, ${centerLng})["admin_level"];
  rel(around:${radiusMeters}, ${centerLat}, ${centerLng})["admin_level"];
);
out center body;
`;

  const data = await queryOverpass(ql);
  console.log(`Found ${data.elements?.length || 0} place/administrative elements.\n`);

  const places = (data.elements || []).map((el) => {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const dist = lat && lon ? haversineMeters(centerLat, centerLng, lat, lon) : null;
    return {
      id: `${el.type}/${el.id}`,
      name: el.tags?.name || el.tags?.['name:en'] || '(unnamed)',
      nameKn: el.tags?.['name:kn'] || '',
      place: el.tags?.place || el.tags?.admin_level || '',
      adminLevel: el.tags?.admin_level || '',
      tags: el.tags,
      lat,
      lon,
      distMeters: dist ? Math.round(dist) : null,
    };
  });

  places.sort((a, b) => (a.distMeters ?? 999999) - (b.distMeters ?? 999999));

  console.log('Nearest places to [' + centerLat + ', ' + centerLng + ']:');
  console.log('---------------------------------------------------------');
  places.forEach((p) => {
    console.log(
      `- ${p.name} (${p.nameKn || ''}) | type: ${p.place} | distance: ${p.distMeters} m | coords: [${p.lat}, ${p.lon}]`
    );
  });
}

main().catch(console.error);

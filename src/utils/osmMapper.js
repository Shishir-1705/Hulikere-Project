function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(ptA, ptB) {
  const [lat1, lon1] = ptA;
  const [lat2, lon2] = ptB;
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculatePolylineMeters(latLngPoints) {
  let total = 0;
  for (let i = 1; i < latLngPoints.length; i += 1) {
    total += haversineMeters(latLngPoints[i - 1], latLngPoints[i]);
  }
  return Math.max(10, Math.round(total));
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
    const d = haversineMeters([lat, lng], w.center);
    if (d < bestDist) {
      bestDist = d;
      bestWard = w.ward;
    }
  }
  return bestWard;
}

function extractCenterLatLng(geometry) {
  if (!geometry) return null;
  if (geometry.type === 'Point' && Array.isArray(geometry.coordinates)) {
    const [lon, lat] = geometry.coordinates;
    return [Number(lat.toFixed(6)), Number(lon.toFixed(6))];
  }
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
    const pts = geometry.coordinates;
    if (pts.length === 0) return null;
    const mid = pts[Math.floor(pts.length / 2)];
    return [Number(mid[1].toFixed(6)), Number(mid[0].toFixed(6))];
  }
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates?.[0])) {
    const ring = geometry.coordinates[0];
    if (ring.length === 0) return null;
    const avgLon = ring.reduce((s, p) => s + p[0], 0) / ring.length;
    const avgLat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    return [Number(avgLat.toFixed(6)), Number(avgLon.toFixed(6))];
  }
  return null;
}

function mapRoadSurface(surfaceRaw, highwayRaw) {
  const s = String(surfaceRaw || '').toLowerCase();
  const h = String(highwayRaw || '').toLowerCase();

  if (s.includes('concrete') || s.includes('cement') || s.includes('paving_stones')) {
    return 'CC';
  }
  if (s.includes('asphalt') || s.includes('tar') || s.includes('bitumen') || s === 'paved') {
    return 'tar';
  }
  if (s.includes('gravel') || s.includes('compacted') || s.includes('pebblestone') || s.includes('macadam')) {
    return 'WBM';
  }
  if (s.includes('unpaved') || s.includes('dirt') || s.includes('earth') || s.includes('mud') || s.includes('ground') || s.includes('sand')) {
    return 'kaccha';
  }

  if (h === 'track' || h === 'path' || h === 'footway') return 'kaccha';
  if (h === 'unclassified' || h === 'service') return 'WBM';
  return 'tar';
}

function mapRoadCondition(smoothnessRaw, mappedSurface) {
  const sm = String(smoothnessRaw || '').toLowerCase();
  if (sm === 'excellent' || sm === 'good') return 'good';
  if (sm === 'intermediate') return 'fair';
  if (sm === 'bad' || sm === 'very_bad' || sm === 'horrible' || sm === 'impassable') {
    return 'poor';
  }
  if (mappedSurface === 'kaccha') return 'poor';
  if (mappedSurface === 'WBM') return 'fair';
  return 'good';
}

function mapHighwayWidth(tags, highwayRaw) {
  const parsed = parseFloat(tags?.width);
  if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  const h = String(highwayRaw || '').toLowerCase();
  if (h === 'primary' || h === 'trunk') return 7.0;
  if (h === 'secondary') return 6.0;
  if (h === 'tertiary') return 5.0;
  if (h === 'residential') return 4.0;
  return 3.5;
}

function formatHighwayTitle(highway) {
  if (!highway) return 'Village Road';
  const clean = String(highway).replace(/_/g, ' ');
  return clean.charAt(0).toUpperCase() + clean.slice(1) + ' Road';
}

function mapBuildingType(tags = {}) {
  const amenity = String(tags.amenity || '').toLowerCase();
  const bldg = String(tags.building || '').toLowerCase();
  const office = String(tags.office || '').toLowerCase();
  const nameLower = String(tags.name || '').toLowerCase();

  if (amenity === 'kindergarten' || bldg === 'kindergarten' || nameLower.includes('anganwadi')) {
    return 'anganwadi';
  }
  if (amenity === 'school' || bldg === 'school' || nameLower.includes('school')) {
    return 'primary school';
  }
  if (
    amenity === 'hospital' ||
    amenity === 'clinic' ||
    amenity === 'doctors' ||
    bldg === 'hospital' ||
    bldg === 'clinic' ||
    nameLower.includes('phc') ||
    nameLower.includes('hospital') ||
    nameLower.includes('clinic')
  ) {
    return 'PHC';
  }
  if (
    office === 'government' ||
    office === 'administrative' ||
    tags.government ||
    amenity === 'townhall' ||
    bldg === 'government' ||
    bldg === 'civic' ||
    nameLower.includes('panchayat')
  ) {
    return 'panchayat office';
  }
  if (
    amenity === 'place_of_worship' ||
    bldg === 'temple' ||
    nameLower.includes('temple') ||
    nameLower.includes('devasthana') ||
    nameLower.includes('masjid') ||
    nameLower.includes('church')
  ) {
    return 'temple hall';
  }
  return 'community hall';
}

function mapWaterTankType(manMade) {
  const mm = String(manMade || '').toLowerCase();
  if (mm === 'water_tower') return 'overhead';
  if (mm === 'water_well') return 'open well';
  return 'ground-level';
}

export function tagAsSample(items = []) {
  return items.map((item) => ({
    ...item,
    dataSource: item.dataSource || 'sample',
    isSample: item.dataSource ? item.dataSource === 'sample' : true,
  }));
}

export function mergeOsmWithSampleAssets(sampleAssets, osmGeoJson) {
  const wards = sampleAssets.wards || [];
  const features = Array.isArray(osmGeoJson?.features) ? osmGeoJson.features : [];
  const fetchedDate = osmGeoJson?.metadata?.fetchedAt
    ? osmGeoJson.metadata.fetchedAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const osmRoads = [];
  const osmBuildings = [];
  const osmWaterTanks = [];
  const osmLights = [];

  for (const feature of features) {
    const props = feature.properties || {};
    const tags = props.tags || {};
    const category = props.category;

    if (
      category === 'road' &&
      feature.geometry?.type === 'LineString' &&
      Array.isArray(feature.geometry.coordinates) &&
      feature.geometry.coordinates.length >= 2
    ) {
      const latLngs = feature.geometry.coordinates.map(([lon, lat]) => [
        Number(lat.toFixed(6)),
        Number(lon.toFixed(6)),
      ]);
      const mid = latLngs[Math.floor(latLngs.length / 2)];
      const surfaceType = mapRoadSurface(tags.surface, tags.highway);
      const enName =
        tags['name:en'] ||
        tags.name ||
        `${formatHighwayTitle(tags.highway)} (${props.osmId})`;
      const knName = tags['name:kn'] || tags.name || `${enName}`;

      osmRoads.push({
        id: props.id || `OSM-RD-${String(osmRoads.length + 1).padStart(2, '0')}`,
        name: { en: enName, kn: knName },
        ward: props.ward || assignWard(mid[0], mid[1], wards),
        type: surfaceType,
        length: calculatePolylineMeters(latLngs),
        width: mapHighwayWidth(tags, tags.highway),
        condition: props.condition || 'Unknown',
        lastRepaired: fetchedDate,
        coordinates: latLngs,
        notes: `OSM highway=${tags.highway || 'road'}${
          tags.surface ? `, surface=${tags.surface}` : ''
        }`,
        osmId: props.osmId,
        osmTags: {
          highway: tags.highway || null,
          surface: tags.surface || null,
        },
        dataSource: 'osm',
        isSample: false,
        maintenanceHistory: [
          {
            id: `MH-OSM-RD-${osmRoads.length + 1}`,
            date: fetchedDate,
            action: 'Imported from OpenStreetMap',
            performedBy: 'Overpass API',
            notes: `OSM ${props.osmId} (highway=${tags.highway || 'untagged'})`,
          },
        ],
      });
    } else if (category === 'publicBuilding') {
      const center = extractCenterLatLng(feature.geometry);
      if (!center) continue;
      const bldgType = mapBuildingType(tags);
      const enName =
        tags['name:en'] ||
        tags.name ||
        `${bldgType.replace(/^\w/, (c) => c.toUpperCase())} (${props.osmId})`;
      const knName = tags['name:kn'] || tags.name || enName;

      osmBuildings.push({
        id: props.id || `OSM-PB-${String(osmBuildings.length + 1).padStart(2, '0')}`,
        name: { en: enName, kn: knName },
        ward: props.ward || assignWard(center[0], center[1], wards),
        type: bldgType,
        yearBuilt: Number(tags.start_date) || 2015,
        condition: props.condition || 'Unknown',
        coordinates: center,
        notes: `OSM ${
          tags.amenity
            ? `amenity=${tags.amenity}`
            : tags.office
            ? `office=${tags.office}`
            : `building=${tags.building || 'yes'}`
        }`,
        osmId: props.osmId,
        dataSource: 'osm',
        isSample: false,
        maintenanceHistory: [
          {
            id: `MH-OSM-PB-${osmBuildings.length + 1}`,
            date: fetchedDate,
            action: 'Imported from OpenStreetMap',
            performedBy: 'Overpass API',
            notes: `OSM ${props.osmId}`,
          },
        ],
      });
    } else if (category === 'waterTank') {
      const center = extractCenterLatLng(feature.geometry);
      if (!center) continue;
      const isReservoir = tags.landuse === 'reservoir' || tags.natural === 'water';
      const tankType = isReservoir ? 'ground-level' : mapWaterTankType(tags.man_made);
      const enName =
        tags['name:en'] ||
        tags.name ||
        (isReservoir ? 'Hulikere Kere (Reservoir)' : `${tags.man_made || 'Water Tank'} (${props.osmId})`);
      const knName = tags['name:kn'] || tags.name || (isReservoir ? 'ಹುಲಿಕೆರೆ ಕೆರೆ (ಜಲಾಶಯ)' : enName);

      osmWaterTanks.push({
        id: props.id || `OSM-WT-${String(osmWaterTanks.length + 1).padStart(2, '0')}`,
        name: { en: enName, kn: knName },
        ward: props.ward || assignWard(center[0], center[1], wards),
        type: tankType,
        capacity: isReservoir ? 250000 : tankType === 'overhead' ? 40000 : tankType === 'open well' ? 15000 : 20000,
        yearBuilt: 2016,
        condition: props.condition || 'Unknown',
        lastCleaningDate: fetchedDate,
        householdsServed: isReservoir ? 150 : 60,
        coordinates: center,
        notes: isReservoir ? `OSM reservoir / lake (${props.osmId})` : `OSM man_made=${tags.man_made || 'water_tank'}`,
        osmId: props.osmId,
        dataSource: 'osm',
        isSample: false,
        maintenanceHistory: [
          {
            id: `MH-OSM-WT-${osmWaterTanks.length + 1}`,
            date: fetchedDate,
            action: 'Imported from OpenStreetMap',
            performedBy: 'Overpass API',
            notes: `OSM ${props.osmId}`,
          },
        ],
      });
    } else if (category === 'streetLight') {
      const center = extractCenterLatLng(feature.geometry);
      if (!center) continue;
      osmLights.push({
        id: props.id || `OSM-SL-${String(osmLights.length + 1).padStart(2, '0')}`,
        poleNumber: `OSM-P-${osmLights.length + 1}`,
        type: 'LED',
        installedDate: fetchedDate,
        status: 'working',
        condition: props.condition || 'Unknown',
        ward: props.ward || assignWard(center[0], center[1], wards),
        coordinates: center,
        notes: `OSM highway=street_lamp (${props.osmId})`,
        osmId: props.osmId,
        dataSource: 'osm',
        isSample: false,
      });
    }
  }

  // Deduplicate sample water tanks against OSM water tanks (within 10 m)
  const fallbackSampleTanks = tagAsSample(
    (sampleAssets.waterTanks || []).filter((sTank) => {
      const sCenter = sTank.coordinates;
      if (!Array.isArray(sCenter) || sCenter.length !== 2) return true;
      return !osmWaterTanks.some(
        (oTank) => Array.isArray(oTank.coordinates) && haversineMeters(sCenter, oTank.coordinates) <= 10
      );
    })
  );

  const finalWaterTanks =
    osmWaterTanks.length > 0 || fallbackSampleTanks.length > 0
      ? [...osmWaterTanks, ...fallbackSampleTanks]
      : tagAsSample(sampleAssets.waterTanks || []);

  const finalRoads =
    osmRoads.length > 0 ? osmRoads : tagAsSample(sampleAssets.roads || []);

  // Deduplicate sample buildings against OSM buildings (within 10 m)
  const missingSampleBuildings = tagAsSample(
    (sampleAssets.publicBuildings || []).filter((sBldg) => {
      const sCenter = sBldg.coordinates;
      if (!Array.isArray(sCenter) || sCenter.length !== 2) return true;
      return !osmBuildings.some(
        (oBldg) => Array.isArray(oBldg.coordinates) && haversineMeters(sCenter, oBldg.coordinates) <= 10
      );
    })
  );

  const finalBuildings =
    osmBuildings.length > 0 || missingSampleBuildings.length > 0
      ? [...osmBuildings, ...missingSampleBuildings]
      : tagAsSample(sampleAssets.publicBuildings || []);

  // Deduplicate sample lights against OSM lights (within 10 m)
  const missingSampleLights = tagAsSample(
    (sampleAssets.streetLights || []).filter((sLight) => {
      const sCenter = sLight.coordinates;
      if (!Array.isArray(sCenter) || sCenter.length !== 2) return true;
      return !osmLights.some(
        (oLight) => Array.isArray(oLight.coordinates) && haversineMeters(sCenter, oLight.coordinates) <= 10
      );
    })
  );

  const finalLights =
    osmLights.length > 0
      ? [...osmLights, ...missingSampleLights]
      : tagAsSample(sampleAssets.streetLights || []);

  return {
    ...sampleAssets,
    meta: {
      ...sampleAssets.meta,
      center: osmGeoJson?.metadata?.center || sampleAssets.meta.center || [12.57056, 76.77363],
      bbox: osmGeoJson?.metadata?.bbox || sampleAssets.meta.bbox,
      osmFetchedAt: osmGeoJson?.metadata?.fetchedAt || null,
      osmCounts: osmGeoJson?.metadata?.counts || null,
      hasRealOsmData: osmRoads.length > 0 || osmBuildings.length > 0 || osmWaterTanks.length > 0,
    },
    wards: sampleAssets.wards,
    waterTanks: finalWaterTanks,
    roads: finalRoads,
    publicBuildings: finalBuildings,
    streetLights: finalLights,
  };
}

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RefreshCw } from 'lucide-react';
import {
  getLocalizedName,
  getSecondaryName,
  tr,
  translateAssetType,
  translateStatus,
  translateWardShort,
} from '../i18n/translations';
import {
  getAssetCenter,
  getStatusMeta,
  getStatusValue,
} from '../utils/assetHelpers';
import { MapControlsPanel } from './MapControlsPanel';
import { MapLegend } from './MapLegend';

const VILLAGE_CENTER = [12.52, 76.9];
const VILLAGE_ZOOM = 17;

const WARD_COLORS = ['#0f766e', '#2563eb', '#9333ea', '#d97706', '#db2777'];

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTankIcon(condition, isSelected) {
  const status = getStatusMeta(condition);
  const size = isSelected ? 40 : 34;
  const isPoor = status.bucket === 'poor';
  const ring = isSelected
    ? 'box-shadow: 0 0 0 3px #0f172a, 0 6px 14px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 2px 8px rgba(15,23,42,0.28);';
  const pulse = isPoor
    ? `<span class="gp-faulty-pulse" style="position:absolute;inset:-5px;border-radius:9999px;border:2.5px solid #dc2626;"></span>`
    : '';

  return L.divIcon({
    className: 'gp-custom-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:9999px;background:${status.colorHex};padding:3px;display:flex;align-items:center;justify-content:center;${ring}transition:all 150ms ease;">
        ${pulse}
        <div style="width:100%;height:100%;border-radius:9999px;background:#0284c7;border:1.5px solid #ffffff;display:flex;align-items:center;justify-content:center;">
          <svg width="${isSelected ? 17 : 14}" height="${isSelected ? 17 : 14}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        </div>
      </div>
    `,
  });
}

function buildBuildingIcon(condition, isSelected) {
  const status = getStatusMeta(condition);
  const size = isSelected ? 40 : 34;
  const isPoor = status.bucket === 'poor';
  const ring = isSelected
    ? 'box-shadow: 0 0 0 3px #0f172a, 0 6px 14px rgba(0,0,0,0.35);'
    : 'box-shadow: 0 2px 8px rgba(15,23,42,0.28);';
  const pulse = isPoor
    ? `<span class="gp-faulty-pulse" style="position:absolute;inset:-5px;border-radius:12px;border:2.5px solid #dc2626;"></span>`
    : '';

  return L.divIcon({
    className: 'gp-custom-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:10px;background:${status.colorHex};padding:3px;display:flex;align-items:center;justify-content:center;${ring}transition:all 150ms ease;">
        ${pulse}
        <div style="width:100%;height:100%;border-radius:7px;background:#4f46e5;border:1.5px solid #ffffff;display:flex;align-items:center;justify-content:center;">
          <svg width="${isSelected ? 17 : 14}" height="${isSelected ? 17 : 14}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
            <path d="M10 6h4"></path>
            <path d="M10 10h4"></path>
            <path d="M10 14h4"></path>
            <path d="M10 18h4"></path>
          </svg>
        </div>
      </div>
    `,
  });
}

function buildStreetLightIcon(status, isSelected) {
  const isFaulty = status === 'faulty';
  const size = isSelected ? 28 : 22;
  const conditionColor = isFaulty ? '#dc2626' : '#16a34a';
  const innerBg = isFaulty ? '#991b1b' : '#f59e0b';
  const pulse = isFaulty
    ? `<span class="gp-faulty-pulse" style="position:absolute;inset:-4px;border-radius:9999px;border:2px solid #dc2626;"></span>`
    : '';
  const selectedRing = isSelected
    ? 'box-shadow: 0 0 0 3px #0f172a, 0 4px 10px rgba(0,0,0,0.3);'
    : 'box-shadow: 0 1px 5px rgba(15,23,42,0.3);';

  return L.divIcon({
    className: 'gp-custom-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:9999px;background:${conditionColor};padding:2.5px;display:flex;align-items:center;justify-content:center;${selectedRing}">
        ${pulse}
        <div style="width:100%;height:100%;border-radius:9999px;background:${innerBg};border:1px solid #ffffff;display:flex;align-items:center;justify-content:center;">
          <svg width="${isSelected ? 13 : 10}" height="${isSelected ? 13 : 10}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
            <path d="M9 18h6"></path>
            <path d="M10 22h4"></path>
          </svg>
        </div>
      </div>
    `,
  });
}

function buildTooltipHtml(item, subtitle, lang) {
  const rawStatus = getStatusValue(item);
  const status = getStatusMeta(rawStatus);
  const statusText = translateStatus(rawStatus, lang);
  const primaryName = getLocalizedName(item, lang);
  const secondaryName = getSecondaryName(item, lang);
  const wardLabel = translateWardShort(item.ward, lang);
  const sourceLabel =
    item.dataSource === 'osm' ? tr(lang, 'sourceOsm') : tr(lang, 'sourceSample');
  const sourceColor = item.dataSource === 'osm' ? '#38bdf8' : '#fbbf24';
  const statusColor =
    status.bucket === 'good'
      ? '#4ade80'
      : status.bucket === 'fair'
      ? '#fbbf24'
      : '#fb7185';
  return `
    <div style="min-width:165px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
        <span style="font-weight:700;font-size:12px;color:#ffffff;">${escapeHtml(primaryName)}</span>
        <span style="font-size:10px;font-weight:700;color:${sourceColor};border:1px solid ${sourceColor};border-radius:4px;padding:0 4px;">${escapeHtml(sourceLabel)}</span>
      </div>
      ${
        secondaryName
          ? `<div style="font-size:11px;color:#cbd5e1;margin-top:1px;">${escapeHtml(secondaryName)}</div>`
          : ''
      }
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;font-size:11px;">
        <span style="color:#94a3b8;">${escapeHtml(wardLabel)} • ${escapeHtml(subtitle)}</span>
        <span style="font-weight:700;color:${statusColor};">${escapeHtml(statusText)}</span>
      </div>
    </div>
  `;
}

export function VillageMap({
  lang,
  wards,
  filteredAssets,
  totalCounts,
  visibleLayers,
  onToggleLayer,
  searchQuery,
  onSearchChange,
  wardFilter,
  onWardChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  onOpenListDrawer,
  selectedAssetKey,
  focusRequest,
  onSelectAsset,
  pickMode,
  onMapPickPoint,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const hasAutoFitOsmRef = useRef(false);
  const [tilesLoading, setTilesLoading] = useState(true);
  const layersRef = useRef({
    wards: null,
    roads: null,
    waterTanks: null,
    publicBuildings: null,
    streetLights: null,
    draft: null,
  });

  const pickModeRef = useRef(pickMode);
  pickModeRef.current = pickMode;
  const onMapPickPointRef = useRef(onMapPickPoint);
  onMapPickPointRef.current = onMapPickPoint;
  const onSelectAssetRef = useRef(onSelectAsset);
  onSelectAssetRef.current = onSelectAsset;

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: VILLAGE_CENTER,
      zoom: VILLAGE_ZOOM,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    });
    tileLayer.on('loading', () => setTilesLoading(true));
    tileLayer.on('load', () => setTilesLoading(false));
    tileLayer.on('tileerror', () => setTilesLoading(false));
    tileLayer.addTo(map);

    layersRef.current = {
      wards: L.layerGroup().addTo(map),
      roads: L.layerGroup().addTo(map),
      waterTanks: L.layerGroup().addTo(map),
      publicBuildings: L.layerGroup().addTo(map),
      streetLights: L.layerGroup().addTo(map),
      draft: L.layerGroup().addTo(map),
    };

    map.on('click', (e) => {
      if (pickModeRef.current?.active) {
        onMapPickPointRef.current?.([
          Number(e.latlng.lat.toFixed(6)),
          Number(e.latlng.lng.toFixed(6)),
        ]);
      }
    });

    mapInstanceRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current === map && mapContainerRef.current) {
        try {
          map.invalidateSize({ animate: false });
        } catch {
          // Ignore if map was just unmounted
        }
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layersRef.current = {
        wards: null,
        roads: null,
        waterTanks: null,
        publicBuildings: null,
        streetLights: null,
        draft: null,
      };
    };
  }, []);

  // Toggle cursor in pick mode
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    container.style.cursor = pickMode?.active ? 'crosshair' : '';
  }, [pickMode?.active]);

  // Render Ward Boundaries
  useEffect(() => {
    const group = layersRef.current.wards;
    if (!group) return;
    group.clearLayers();
    if (!visibleLayers.wards) return;

    wards.forEach((ward, index) => {
      if (!Array.isArray(ward.polygon) || ward.polygon.length < 3) return;
      const color = WARD_COLORS[index % WARD_COLORS.length];
      const isHighlightedWard = wardFilter === ward.ward;

      const poly = L.polygon(ward.polygon, {
        color,
        weight: isHighlightedWard ? 2.5 : 1.5,
        dashArray: isHighlightedWard ? null : '5, 5',
        fillColor: color,
        fillOpacity: isHighlightedWard ? 0.14 : 0.06,
        interactive: false,
      });

      poly.addTo(group);

      if (Array.isArray(ward.center) && ward.center.length === 2) {
        const labelText = translateWardShort(ward.ward, lang);
        const labelIcon = L.divIcon({
          className: 'gp-custom-icon',
          iconSize: [110, 22],
          iconAnchor: [55, 11],
          html: `<div style="text-align:center;font-size:10px;font-weight:700;color:${color};text-shadow:0 1px 2px #fff, 0 -1px 2px #fff, 1px 0 2px #fff, -1px 0 2px #fff;pointer-events:none;white-space:nowrap;">${escapeHtml(
            labelText
          )}</div>`,
        });
        L.marker(ward.center, { icon: labelIcon, interactive: false }).addTo(group);
      }
    });
  }, [wards, visibleLayers.wards, wardFilter, lang]);

  // Render Filtered Assets
  useEffect(() => {
    const { roads, waterTanks, publicBuildings, streetLights } = layersRef.current;
    if (!roads || !waterTanks || !publicBuildings || !streetLights) return;

    roads.clearLayers();
    waterTanks.clearLayers();
    publicBuildings.clearLayers();
    streetLights.clearLayers();

    for (const item of filteredAssets) {
      const key = `${item.category}:${item.id}`;
      const isSelected = selectedAssetKey === key;

      if (item.category === 'roads' && visibleLayers.roads) {
        if (!Array.isArray(item.coordinates) || item.coordinates.length < 2) continue;
        const statusMeta = getStatusMeta(item.condition);
        const dashArray =
          item.type === 'kaccha'
            ? '6, 6'
            : item.type === 'WBM'
            ? '10, 5'
            : null;

        const casing = L.polyline(item.coordinates, {
          color: isSelected ? '#0f172a' : '#ffffff',
          weight: isSelected ? 11 : 8,
          opacity: isSelected ? 0.9 : 0.92,
          lineCap: 'round',
          lineJoin: 'round',
        });

        const line = L.polyline(item.coordinates, {
          color: statusMeta.colorHex,
          weight: isSelected ? 6.5 : 4.5,
          opacity: 0.95,
          dashArray,
          lineCap: 'round',
          lineJoin: 'round',
        });

        const tooltipHtml = buildTooltipHtml(
          item,
          `${translateAssetType(item.type, lang)} • ${item.length}${tr(
            lang,
            'unitMetersShort'
          )}`,
          lang
        );
        line.bindTooltip(tooltipHtml, {
          sticky: true,
          className: 'gp-tooltip',
          direction: 'top',
        });

        const handleClick = () => onSelectAssetRef.current?.('roads', item.id, false);
        casing.on('click', handleClick);
        line.on('click', handleClick);

        casing.addTo(roads);
        line.addTo(roads);
      } else if (item.category === 'waterTanks' && visibleLayers.waterTanks) {
        if (!Array.isArray(item.coordinates) || item.coordinates.length !== 2) continue;
        const marker = L.marker(item.coordinates, {
          icon: buildTankIcon(item.condition, isSelected),
          zIndexOffset: isSelected ? 600 : 250,
        });
        marker.bindTooltip(
          buildTooltipHtml(
            item,
            `${Number(item.capacity).toLocaleString('en-IN')} ${tr(
              lang,
              'unitLitersShort'
            )}`,
            lang
          ),
          {
            direction: 'top',
            offset: [0, -16],
            className: 'gp-tooltip',
          }
        );
        marker.on('click', () => onSelectAssetRef.current?.('waterTanks', item.id, false));
        marker.addTo(waterTanks);
      } else if (
        item.category === 'publicBuildings' &&
        visibleLayers.publicBuildings
      ) {
        if (!Array.isArray(item.coordinates) || item.coordinates.length !== 2) continue;
        const marker = L.marker(item.coordinates, {
          icon: buildBuildingIcon(item.condition, isSelected),
          zIndexOffset: isSelected ? 600 : 240,
        });
        marker.bindTooltip(
          buildTooltipHtml(item, translateAssetType(item.type, lang), lang),
          {
            direction: 'top',
            offset: [0, -16],
            className: 'gp-tooltip',
          }
        );
        marker.on('click', () =>
          onSelectAssetRef.current?.('publicBuildings', item.id, false)
        );
        marker.addTo(publicBuildings);
      } else if (item.category === 'streetLights' && visibleLayers.streetLights) {
        if (!Array.isArray(item.coordinates) || item.coordinates.length !== 2) continue;
        const marker = L.marker(item.coordinates, {
          icon: buildStreetLightIcon(item.status, isSelected),
          zIndexOffset: isSelected ? 550 : item.status === 'faulty' ? 180 : 60,
        });
        marker.bindTooltip(
          buildTooltipHtml(
            item,
            `${item.poleNumber} • ${translateAssetType(item.type, lang)}`,
            lang
          ),
          {
            direction: 'top',
            offset: [0, -10],
            className: 'gp-tooltip',
          }
        );
        marker.on('click', () =>
          onSelectAssetRef.current?.('streetLights', item.id, false)
        );
        marker.addTo(streetLights);
      }
    }
  }, [filteredAssets, selectedAssetKey, visibleLayers, lang]);

  // Render draft location preview during Add Asset pick mode (or focused complaint pin)
  useEffect(() => {
    const group = layersRef.current.draft;
    if (!group) return;
    group.clearLayers();

    if (
      !pickMode?.active &&
      focusRequest?.type === 'coordinates' &&
      Array.isArray(focusRequest.coordinates) &&
      focusRequest.coordinates.length === 2
    ) {
      const marker = L.circleMarker(focusRequest.coordinates, {
        radius: 10,
        color: '#b91c1c',
        fillColor: '#ef4444',
        fillOpacity: 0.9,
        weight: 3,
      });
      if (focusRequest.label) {
        marker.bindTooltip(escapeHtml(focusRequest.label), {
          permanent: true,
          direction: 'top',
          offset: [0, -10],
          className: 'gp-tooltip',
        });
      }
      marker.addTo(group);
      return;
    }

    if (!pickMode?.active || !Array.isArray(pickMode.points)) return;

    if (pickMode.mode === 'road' && pickMode.points.length > 0) {
      if (pickMode.points.length >= 2) {
        L.polyline(pickMode.points, {
          color: '#059669',
          weight: 5,
          dashArray: '6, 6',
        }).addTo(group);
      }
      pickMode.points.forEach((pt, idx) => {
        L.circleMarker(pt, {
          radius: 5,
          color: '#065f46',
          fillColor: idx === 0 ? '#10b981' : '#ffffff',
          fillOpacity: 1,
          weight: 2,
        }).addTo(group);
      });
    } else if (pickMode.mode === 'point' && pickMode.points.length === 1) {
      L.circleMarker(pickMode.points[0], {
        radius: 9,
        color: '#047857',
        fillColor: '#10b981',
        fillOpacity: 0.85,
        weight: 3,
      }).addTo(group);
    }
  }, [pickMode, focusRequest]);

  // Handle focus requests
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusRequest) return;

    map.invalidateSize({ animate: false });

    if (focusRequest.type === 'asset' && focusRequest.asset) {
      const { category, asset } = focusRequest;
      if (category === 'roads' && Array.isArray(asset.coordinates) && asset.coordinates.length >= 2) {
        const bounds = L.latLngBounds(asset.coordinates);
        map.flyToBounds(bounds, { padding: [70, 70], maxZoom: 18, duration: 0.6 });
      } else {
        const center = getAssetCenter(category, asset);
        map.flyTo(center, Math.max(map.getZoom(), 18), { duration: 0.55 });
      }
    } else if (focusRequest.type === 'coordinates' && Array.isArray(focusRequest.coordinates)) {
      map.flyTo(focusRequest.coordinates, 18, { duration: 0.55 });
    } else if (focusRequest.type === 'ward' && focusRequest.ward) {
      const w = focusRequest.ward;
      if (Array.isArray(w.polygon) && w.polygon.length >= 3) {
        map.flyToBounds(L.latLngBounds(w.polygon), {
          padding: [50, 50],
          maxZoom: 18,
          duration: 0.6,
        });
      } else if (Array.isArray(w.center)) {
        map.flyTo(w.center, 18, { duration: 0.6 });
      }
    } else if (focusRequest.type === 'recenter') {
      map.flyTo(VILLAGE_CENTER, VILLAGE_ZOOM, { duration: 0.6 });
    }
  }, [focusRequest]);

  const fitVillageOrOsm = (map, animate = true) => {
    const osmCoords = [];
    for (const item of filteredAssets) {
      if (item.dataSource !== 'osm' || !Array.isArray(item.coordinates)) continue;
      if (item.category === 'roads') {
        osmCoords.push(...item.coordinates);
      } else if (item.coordinates.length === 2) {
        osmCoords.push(item.coordinates);
      }
    }
    if (osmCoords.length > 0) {
      map.fitBounds(L.latLngBounds(osmCoords), {
        padding: [40, 40],
        maxZoom: 17,
        animate,
      });
    } else if (animate) {
      map.flyTo(VILLAGE_CENTER, VILLAGE_ZOOM, { duration: 0.55 });
    } else {
      map.setView(VILLAGE_CENTER, VILLAGE_ZOOM);
    }
  };

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || hasAutoFitOsmRef.current || focusRequest) return;
    const hasOsm = filteredAssets.some((item) => item.dataSource === 'osm');
    if (hasOsm) {
      hasAutoFitOsmRef.current = true;
      fitVillageOrOsm(map, false);
    }
  }, [filteredAssets, focusRequest]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      fitVillageOrOsm(mapInstanceRef.current, true);
    }
  };

  return (
    <div className="relative w-full h-full flex-1 min-h-0">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Pick Location Banner */}
      {pickMode?.active ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-3 max-w-[92%]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs sm:text-sm font-medium">
            {pickMode.mode === 'road'
              ? `${tr(lang, 'pickRoadHintPrefix')} (${pickMode.points.length} ${tr(
                  lang,
                  'pointsAddedSuffix'
                )})`
              : tr(lang, 'pickPointHint')}
          </span>
          <button
            type="button"
            onClick={pickMode.onDone}
            className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shrink-0"
          >
            {tr(lang, 'done')}
          </button>
        </div>
      ) : (
        <MapControlsPanel
          lang={lang}
          wards={wards}
          totalCounts={totalCounts}
          filteredCount={filteredAssets.length}
          visibleLayers={visibleLayers}
          onToggleLayer={onToggleLayer}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          wardFilter={wardFilter}
          onWardChange={onWardChange}
          statusFilter={statusFilter}
          onStatusChange={onStatusChange}
          onClearFilters={onClearFilters}
          onOpenListDrawer={onOpenListDrawer}
          onRecenter={handleRecenter}
        />
      )}

      {/* Corner Legend */}
      <MapLegend lang={lang} />

      {/* Map Tile Loading Indicator */}
      {tilesLoading && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] bg-white/95 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-md inline-flex items-center gap-2 text-[11px] font-semibold text-sky-800 pointer-events-none">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>{tr(lang, 'loadingMapTiles')}</span>
        </div>
      )}
    </div>
  );
}

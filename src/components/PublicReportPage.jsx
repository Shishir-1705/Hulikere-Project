import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  CheckCircle2,
  Crosshair,
  Droplets,
  Landmark,
  Lightbulb,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Wrench,
} from 'lucide-react';
import { PhotoCaptureInput } from './PhotoCaptureInput';

const DEFAULT_CENTER = [12.57056, 76.77363];

const PROBLEM_TYPES = [
  {
    key: 'street_light',
    assetCategory: 'streetLights',
    en: 'Street Light',
    kn: 'ಬೀದಿ ದೀಪ',
    sub: 'Not working / flickering / pole issue',
    icon: Lightbulb,
    activeClass: 'border-amber-500 bg-amber-50 ring-2 ring-amber-400 text-amber-950',
    iconBg: 'bg-amber-500 text-white',
  },
  {
    key: 'water_leak',
    assetCategory: 'waterTanks',
    en: 'Water Leak',
    kn: 'ನೀರು ಸೋರಿಕೆ',
    sub: 'Pipe leak / valve or tap dripping',
    icon: Droplets,
    activeClass: 'border-sky-500 bg-sky-50 ring-2 ring-sky-400 text-sky-950',
    iconBg: 'bg-sky-600 text-white',
  },
  {
    key: 'road_damage',
    assetCategory: 'roads',
    en: 'Road Damage',
    kn: 'ರಸ್ತೆ ಹಾನಿ',
    sub: 'Potholes / waterlogging / drain block',
    icon: Navigation,
    activeClass: 'border-teal-500 bg-teal-50 ring-2 ring-teal-400 text-teal-950',
    iconBg: 'bg-teal-600 text-white',
  },
  {
    key: 'tank_issue',
    assetCategory: 'waterTanks',
    en: 'Tank Issue',
    kn: 'ಟ್ಯಾಂಕ್ ಸಮಸ್ಯೆ',
    sub: 'Dirty water / pump / tank repair',
    icon: Wrench,
    activeClass: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-400 text-indigo-950',
    iconBg: 'bg-indigo-600 text-white',
  },
];

function detectNearestWard(lat, lng, wards = []) {
  if (!Array.isArray(wards) || wards.length === 0) return 'Ward 1';
  let best = wards[0].ward;
  let bestDist = Infinity;
  for (const w of wards) {
    if (!Array.isArray(w.center) || w.center.length !== 2) continue;
    const dLat = lat - w.center[0];
    const dLng = lng - w.center[1];
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = w.ward;
    }
  }
  return best;
}

function buildPinIcon() {
  return L.divIcon({
    className: 'gp-custom-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;">
        <div style="width:28px;height:28px;border-radius:9999px;background:#dc2626;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
          <div style="width:8px;height:8px;border-radius:9999px;background:#ffffff;"></div>
        </div>
        <div style="width:3px;height:6px;background:#dc2626;margin-top:-1px;border-radius:0 0 2px 2px;"></div>
      </div>
    `,
  });
}

export function PublicReportPage({
  wards = [],
  onSubmitPublicComplaint,
  onGoToPortal,
}) {
  const [problemType, setProblemType] = useState('street_light');
  const [location, setLocation] = useState(DEFAULT_CENTER);
  const [hasPickedLocation, setHasPickedLocation] = useState(false);
  const [ward, setWard] = useState(() =>
    detectNearestWard(DEFAULT_CENTER[0], DEFAULT_CENTER[1], wards)
  );
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [photoDraft, setPhotoDraft] = useState(null);

  const [locating, setLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState(null);

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markerRef = useRef(null);
  const wardsRef = useRef(wards);
  wardsRef.current = wards;

  const selectedProblem = useMemo(
    () => PROBLEM_TYPES.find((p) => p.key === problemType) || PROBLEM_TYPES[0],
    [problemType]
  );

  // Initialize Leaflet picker map
  useEffect(() => {
    if (submittedReceipt) return undefined;
    if (!mapContainerRef.current || mapRef.current) return undefined;

    const map = L.map(mapContainerRef.current, {
      center: location,
      zoom: 17,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const marker = L.marker(location, {
      icon: buildPinIcon(),
      draggable: true,
    }).addTo(map);

    const applyPickedPoint = (lat, lng) => {
      const next = [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
      setLocation(next);
      setHasPickedLocation(true);
      setWard(detectNearestWard(next[0], next[1], wardsRef.current));
      setGeoMessage('');
    };

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      applyPickedPoint(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      applyPickedPoint(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    const ro = new ResizeObserver(() => {
      if (mapRef.current === map && mapContainerRef.current) {
        try {
          map.invalidateSize({ animate: false });
        } catch {
          // Ignore unmount timing
        }
      }
    });
    ro.observe(mapContainerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [submittedReceipt]);

  // Keep marker synced when GPS updates location
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLatLng(location);
    }
  }, [location]);

  const handleUseCurrentLocation = () => {
    setGeoMessage('');
    if (!navigator.geolocation) {
      setGeoMessage(
        'GPS ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ನಕ್ಷೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ / GPS unavailable. Please tap on the map.'
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const next = [
          Number(pos.coords.latitude.toFixed(6)),
          Number(pos.coords.longitude.toFixed(6)),
        ];
        setLocation(next);
        setHasPickedLocation(true);
        setWard(detectNearestWard(next[0], next[1], wards));
        mapRef.current?.flyTo(next, 18, { duration: 0.6 });
      },
      (err) => {
        setLocating(false);
        setGeoMessage(
          err.code === 1
            ? 'ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ನಕ್ಷೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ / Location permission denied. Please tap the map.'
            : 'ಸ್ಥಳ ಪತ್ತೆ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ನಕ್ಷೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ / Could not get GPS location. Please tap the map.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const cleanDesc =
        description.trim() ||
        `${selectedProblem.en} (${selectedProblem.kn}) problem reported via public /report page`;

      const receipt = await onSubmitPublicComplaint({
        problemType: selectedProblem,
        coordinates: location,
        ward,
        description: cleanDesc,
        phone: phone.trim(),
        photoDraft,
      });

      setSubmittedReceipt(receipt);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setProblemType('street_light');
    setLocation(DEFAULT_CENTER);
    setHasPickedLocation(false);
    setWard(detectNearestWard(DEFAULT_CENTER[0], DEFAULT_CENTER[1], wards));
    setDescription('');
    setPhone('');
    setPhotoDraft(null);
    setGeoMessage('');
    setSubmittedReceipt(null);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col">
      {/* Simple Bilingual Public Header */}
      <header className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white px-4 py-3.5 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                ಹುಲಿಕೆರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ • Hulikere GP
              </h1>
              <p className="text-xs text-emerald-100 truncate">
                ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ • Report a Village Problem
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToPortal}
            className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/25 text-xs font-semibold whitespace-nowrap transition shrink-0"
          >
            Staff Portal
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {submittedReceipt ? (
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-lg p-6 sm:p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  ದೂರು ಸಲ್ಲಿಸಲಾಗಿದೆ! • Complaint Submitted!
                </h2>
                <p className="text-sm text-slate-600">
                  ಹುಲಿಕೆರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ಅಧಿಕಾರಿಗಳಿಗೆ ನಿಮ್ಮ ದೂರು ತಲುಪಿದೆ.
                </p>
                <p className="text-xs text-slate-500">
                  Your report has been sent to the Gram Panchayat office.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    ದೂರು ಸಂಖ್ಯೆ / Complaint ID
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    {submittedReceipt.id}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    ಸ್ಥಿತಿ / Status
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    ಹೊಸದು • New
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    ವಾರ್ಡ್ / Ward
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {submittedReceipt.ward}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-base font-bold shadow-sm transition"
              >
                ಮತ್ತೊಂದು ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ • Report Another Problem
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-3xl border border-slate-200 shadow-lg p-5 sm:p-7 space-y-6"
            >
              {/* Intro */}
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  ಗ್ರಾಮದ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ • Report an Issue
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  ಲಾಗಿನ್ ಅಗತ್ಯವಿಲ್ಲ. ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ • No login required.
                </p>
              </div>

              {/* Step 1: Problem Type (4 Big Buttons) */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-900">
                  1. ಸಮಸ್ಯೆಯ ಪ್ರಕಾರ ಆಯ್ಕೆಮಾಡಿ • Choose Problem Type *
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PROBLEM_TYPES.map((item) => {
                    const Icon = item.icon;
                    const active = problemType === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setProblemType(item.key)}
                        className={`p-4 rounded-2xl border text-left transition flex items-center gap-3.5 ${
                          active
                            ? item.activeClass
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            active ? item.iconBg : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold leading-snug">{item.kn}</p>
                          <p className="text-sm font-semibold text-slate-700">
                            {item.en}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {item.sub}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Location Picker (Map + Current GPS Location) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-sm font-bold text-slate-900">
                    2. ಸ್ಥಳ ಗುರುತಿಸಿ • Pick Location *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-60"
                  >
                    {locating ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Crosshair className="w-4 h-4" />
                    )}
                    <span>
                      {locating
                        ? 'ಸ್ಥಳ ಪತ್ತೆ ಮಾಡುತ್ತಿದೆ... / Locating...'
                        : 'ಪ್ರಸ್ತುತ ಸ್ಥಳ ಬಳಸಿ • Use Current Location'}
                    </span>
                  </button>
                </div>

                {geoMessage && (
                  <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    {geoMessage}
                  </p>
                )}

                <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-inner">
                  <div ref={mapContainerRef} className="w-full h-64 sm:h-72 z-0" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {hasPickedLocation
                        ? 'ಸ್ಥಳ ಗುರುತಿಸಲಾಗಿದೆ • Pin set:'
                        : 'ನಕ್ಷೆಯ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ ಅಥವಾ ಪಿನ್ ಎಳೆಯಿರಿ • Tap map or drag pin:'}{' '}
                      <strong className="font-mono">
                        {location[0].toFixed(5)}, {location[1].toFixed(5)}
                      </strong>
                    </span>
                  </div>

                  <select
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    aria-label="Ward"
                    className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {wards.map((w) => (
                      <option key={w.id} value={w.ward}>
                        {w.name?.kn} / {w.ward}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 3: Optional Description, Photo & Phone */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-1.5">
                    3. ಹೆಚ್ಚಿನ ವಿವರ (ಐಚ್ಛಿಕ) • Additional Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ಉದಾ: ದೇವಸ್ಥಾನದ ಬಳಿ ಬೀದಿ ದೀಪ ಉರಿಯುತ್ತಿಲ್ಲ / e.g. Street light near temple is off..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <PhotoCaptureInput
                  lang="kn"
                  label="4. ಫೋಟೋ ಸೇರಿಸಿ (ಐಚ್ಛಿಕ) • Add Photo (Optional)"
                  photoDraft={photoDraft}
                  onChange={setPhotoDraft}
                />

                <div>
                  <label
                    htmlFor="public-phone"
                    className="block text-sm font-bold text-slate-900 mb-1.5"
                  >
                    5. ಫೋನ್ ಸಂಖ್ಯೆ (ಐಚ್ಛಿಕ) • Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="public-phone"
                      type="tel"
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number (e.g. 98450 12345)"
                      className="w-full pl-10 pr-3.5 py-3 text-base bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-base sm:text-lg font-extrabold shadow-md transition disabled:opacity-60"
              >
                {submitting
                  ? 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ... • Submitting...'
                  : 'ದೂರು ಸಲ್ಲಿಸಿ • Submit Complaint'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

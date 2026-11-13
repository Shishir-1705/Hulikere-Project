import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  getLocalizedName,
  tr,
  translateStatus,
  translateWardShort,
} from '../i18n/translations';
import { PhotoCaptureInput } from './PhotoCaptureInput';

const CATEGORY_SINGULAR_KEYS = {
  waterTanks: 'waterTankSingular',
  roads: 'roadSingular',
  publicBuildings: 'publicBuildingSingular',
  streetLights: 'streetLightSingular',
};

const ISSUE_PRESETS = {
  en: {
    waterTanks: [
      'Tank leaking',
      'Needs cleaning & chlorination',
      'Pump or starter fault',
      'Outlet valve / pipe leak',
    ],
    roads: [
      'Potholes / surface damage',
      'Waterlogging / drain blocked',
      'Road shoulder erosion',
      'Needs gravel filling',
    ],
    publicBuildings: [
      'Roof / wall leakage',
      'Electrical / wiring fault',
      'Plumbing / toilet tap fault',
      'Door / window repair needed',
    ],
    streetLights: [
      'Light not working',
      'Flickering / dim lamp',
      'Timer or wire fault',
      'Pole / bracket damaged',
    ],
  },
  kn: {
    waterTanks: [
      'ಟ್ಯಾಂಕ್ ಸೋರುತ್ತಿದೆ',
      'ಸ್ವಚ್ಛತೆ ಮತ್ತು ಕ್ಲೋರಿನೇಷನ್ ಅಗತ್ಯವಿದೆ',
      'ಪಂಪ್ ಅಥವಾ ಸ್ಟಾರ್ಟರ್ ದೋಷ',
      'ವಾಲ್ವ್ / ಪೈಪ್ ಸೋರಿಕೆ',
    ],
    roads: [
      'ರಸ್ತೆ ಗುಂಡಿಗಳು / ಹಾನಿ',
      'ನೀರು ನಿಲ್ಲುವಿಕೆ / ಚರಂಡಿ ಬ್ಲಾಕ್',
      'ರಸ್ತೆ ಬದಿ ಕೊಚ್ಚಿ ಹೋಗಿದೆ',
      'ಜಲ್ಲಿ ತುಂಬುವ ಅಗತ್ಯವಿದೆ',
    ],
    publicBuildings: [
      'ಛಾವಣಿ / ಗೋಡೆ ಸೋರಿಕೆ',
      'ವಿದ್ಯುತ್ / ವೈರಿಂಗ್ ದೋಷ',
      'ನಲ್ಲಿ / ಶೌಚಾಲಯ ದುರಸ್ತಿ',
      'ಬಾಗಿಲು / ಕಿಟಕಿ ದುರಸ್ತಿ ಅಗತ್ಯ',
    ],
    streetLights: [
      'ಬೀದಿ ದೀಪ ಉರಿಯುತ್ತಿಲ್ಲ',
      'ದೀಪ ಮಿನುಗುತ್ತಿದೆ / ಮಂದವಾಗಿದೆ',
      'ಟೈಮರ್ ಅಥವಾ ವೈರ್ ದೋಷ',
      'ಕಂಬ / ಬ್ರಾಕೆಟ್ ಹಾನಿಯಾಗಿದೆ',
    ],
  },
};

export function ReportProblemModal({
  lang = 'en',
  isOpen,
  target,
  defaultReporter,
  onClose,
  onSubmit,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState(defaultReporter || 'PDO Inspection');
  const [markPoorOnSubmit, setMarkPoorOnSubmit] = useState(true);
  const [photoDraft, setPhotoDraft] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setReportedBy(defaultReporter || 'PDO Inspection');
      setMarkPoorOnSubmit(true);
      setPhotoDraft(null);
    }
  }, [isOpen, target?.asset?.id, defaultReporter]);

  if (!isOpen || !target?.asset) return null;

  const { category, asset } = target;
  const presets = (ISSUE_PRESETS[lang] || ISSUE_PRESETS.en)[category] || [];
  const flagWord = translateStatus(
    category === 'streetLights' ? 'faulty' : 'poor',
    lang
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit({
      category,
      asset,
      date,
      description: description.trim(),
      reportedBy: reportedBy.trim() || 'PDO Inspection',
      markPoorOnSubmit,
      photoDraft,
    });
  };

  return (
    <div className="fixed inset-0 z-[650] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {tr(lang, 'reportProblemTitle')}
              </h2>
              <p className="text-xs text-slate-600">
                {tr(lang, CATEGORY_SINGULAR_KEYS[category])} •{' '}
                <span className="font-mono font-semibold">{asset.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5">
            <p className="text-xs font-bold text-slate-900">
              {getLocalizedName(asset, lang)}
            </p>
            <p className="text-[11px] text-slate-500">
              {translateWardShort(asset.ward, lang)}
            </p>
          </div>

          {presets.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                {tr(lang, 'quickIssueTemplates')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setDescription((prev) =>
                        prev ? `${prev}; ${preset}` : preset
                      )
                    }
                    className="px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-[11px] font-medium text-slate-700 transition"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tr(lang, 'problemDescLabel')}
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr(lang, 'problemDescPlaceholder')}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr(lang, 'dateLabel')}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {tr(lang, 'reportedByLabel')}
              </label>
              <input
                type="text"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={markPoorOnSubmit}
              onChange={(e) => setMarkPoorOnSubmit(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>
              {tr(lang, 'flagAssetImmediatelyPrefix')}{' '}
              <strong>{flagWord}</strong>{' '}
              {tr(lang, 'flagAssetImmediatelySuffix')}
            </span>
          </label>

          <PhotoCaptureInput
            lang={lang}
            label={tr(lang, 'problemPhotoLabel')}
            photoDraft={photoDraft}
            onChange={setPhotoDraft}
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
            >
              {tr(lang, 'cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition"
            >
              {tr(lang, 'submitComplaintOpen')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

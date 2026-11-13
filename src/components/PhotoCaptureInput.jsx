import React, { useEffect, useId, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';
import { tr } from '../i18n/translations';
import { compressImageUnder300KB } from '../utils/photoStorage';
import { StoredPhoto } from './StoredPhoto';

export function PhotoCaptureInput({
  lang = 'en',
  label,
  photoDraft,
  existingPhotoId = null,
  onChange,
  onRemoveExisting,
}) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!photoDraft?.blob) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(photoDraft.blob);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoDraft]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setCompressing(true);
    try {
      const result = await compressImageUnder300KB(file);
      onChange(result);
    } catch {
      setError(tr(lang, 'photoError'));
    } finally {
      setCompressing(false);
    }
  };

  const handleClear = () => {
    setError('');
    onChange(null);
    if (existingPhotoId && onRemoveExisting) {
      onRemoveExisting();
    }
  };

  const hasDraft = Boolean(photoDraft?.blob && previewUrl);
  const hasExisting = !hasDraft && Boolean(existingPhotoId);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        {label || tr(lang, 'photoFieldLabel')}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only"
      />

      {compressing ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 px-3.5 py-3 flex items-center gap-2.5 text-xs font-semibold text-sky-800">
          <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
          <span>{tr(lang, 'compressingPhoto')}</span>
        </div>
      ) : hasDraft || hasExisting ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-3">
          <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
            {hasDraft ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <StoredPhoto
                photoId={existingPhotoId}
                loadingLabel={tr(lang, 'loadingPhoto')}
              />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            {hasDraft ? (
              <p className="text-[11px] font-semibold text-emerald-700">
                {Math.max(1, Math.round(photoDraft.sizeBytes / 1024))}{' '}
                {tr(lang, 'photoReadySuffix')}
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-slate-700">
                {tr(lang, 'attachedPhotoBadge')}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
              <label
                htmlFor={inputId}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer transition"
              >
                <Camera className="w-3 h-3 text-emerald-700" />
                <span>{tr(lang, 'changePhoto')}</span>
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[11px] font-semibold text-rose-600 transition"
              >
                <X className="w-3 h-3" />
                <span>{tr(lang, 'removePhoto')}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-emerald-50/40 hover:border-emerald-400 px-3.5 py-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer transition"
        >
          <Camera className="w-4 h-4 text-emerald-700" />
          <span>{tr(lang, 'takeOrUploadPhoto')}</span>
        </label>
      )}

      {error && (
        <p className="text-[11px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

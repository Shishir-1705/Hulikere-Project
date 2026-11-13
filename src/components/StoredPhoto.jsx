import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { getPhotoRecord } from '../utils/photoStorage';

export function StoredPhoto({
  photoId,
  alt = 'Asset field photo',
  className = 'w-full h-full object-cover',
  loadingLabel = 'Loading photo...',
  fallback = null,
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(Boolean(photoId));
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    if (!photoId) {
      setImageUrl(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    getPhotoRecord(photoId)
      .then((record) => {
        if (!active) return;
        if (record?.blob) {
          createdUrl = URL.createObjectURL(record.blob);
          setImageUrl(createdUrl);
        } else {
          setImageUrl(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setImageUrl(null);
        setLoading(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [photoId]);

  if (!photoId) return fallback;

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 text-xs gap-2 p-4">
        <RefreshCw className="w-4 h-4 animate-spin text-sky-700" />
        <span>{loadingLabel}</span>
      </div>
    );
  }

  if (!imageUrl) {
    return fallback;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="w-full h-full block focus:outline-none group cursor-zoom-in"
        title="Click to enlarge photo"
      >
        <img
          src={imageUrl}
          alt={alt}
          className={`${className} group-hover:scale-[1.01] transition-transform`}
        />
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[800] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close photo preview"
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-slate-800 shadow-lg flex items-center justify-center hover:bg-slate-100 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={imageUrl}
              alt={alt}
              className="max-h-[85vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/20 object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

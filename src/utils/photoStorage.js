const DB_NAME = 'hulikere_gp_photos_db';
const DB_VERSION = 1;
const STORE_NAME = 'photos';
const TARGET_MAX_BYTES = 295 * 1024; // Strictly under 300 KB (307,200 bytes)

function openPhotoDb() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open photo DB.'));
  });
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to decode image file.'));
    };
    img.src = objectUrl;
  });
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas compression failed.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Compresses an uploaded/captured image to a JPEG Blob strictly under 300 KB.
 */
export async function compressImageUnder300KB(file) {
  if (!file || !String(file.type || '').startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  let source;
  let naturalWidth = 0;
  let naturalHeight = 0;
  let shouldCloseBitmap = false;

  if (typeof window.createImageBitmap === 'function') {
    try {
      source = await window.createImageBitmap(file);
      naturalWidth = source.width;
      naturalHeight = source.height;
      shouldCloseBitmap = true;
    } catch {
      source = await loadImageElement(file);
      naturalWidth = source.naturalWidth;
      naturalHeight = source.naturalHeight;
    }
  } else {
    source = await loadImageElement(file);
    naturalWidth = source.naturalWidth;
    naturalHeight = source.naturalHeight;
  }

  try {
    const maxDimensions = [1280, 1024, 800, 640, 480];
    const qualities = [0.82, 0.7, 0.58, 0.45, 0.34];

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D canvas context unavailable.');
    }

    let bestBlob = null;

    for (const maxDim of maxDimensions) {
      const scale = Math.min(1, maxDim / Math.max(naturalWidth, naturalHeight, 1));
      const targetWidth = Math.max(1, Math.round(naturalWidth * scale));
      const targetHeight = Math.max(1, Math.round(naturalHeight * scale));

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

      for (const quality of qualities) {
        const blob = await canvasToJpegBlob(canvas, quality);
        bestBlob = blob;
        if (blob.size <= TARGET_MAX_BYTES) {
          return {
            blob,
            sizeBytes: blob.size,
            mimeType: 'image/jpeg',
            width: targetWidth,
            height: targetHeight,
          };
        }
      }
    }

    if (bestBlob && bestBlob.size < 300 * 1024) {
      return {
        blob: bestBlob,
        sizeBytes: bestBlob.size,
        mimeType: 'image/jpeg',
        width: canvas.width,
        height: canvas.height,
      };
    }

    throw new Error('Unable to compress image below 300 KB.');
  } finally {
    if (shouldCloseBitmap && typeof source?.close === 'function') {
      source.close();
    }
  }
}

export function generatePhotoId(prefix = 'PHOTO') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export async function savePhotoBlob(photoId, blob, extra = {}) {
  const db = await openPhotoDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: photoId,
      blob,
      mimeType: blob.type || 'image/jpeg',
      sizeBytes: blob.size,
      createdAt: new Date().toISOString(),
      ...extra,
    });
    tx.oncomplete = () => {
      db.close();
      resolve(photoId);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('Failed to store photo in IndexedDB.'));
    };
  });
}

export async function getPhotoRecord(photoId) {
  if (!photoId) return null;
  try {
    const db = await openPhotoDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(photoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}

export async function deletePhoto(photoId) {
  if (!photoId) return;
  try {
    const db = await openPhotoDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(photoId);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore cleanup errors
  }
}

export async function clearAllPhotos() {
  try {
    const db = await openPhotoDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    // Ignore cleanup errors
  }
}

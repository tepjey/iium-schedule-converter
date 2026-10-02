// Background photos for custom themes. Photos never leave the device: they're kept in
// this browser's IndexedDB (localStorage is far too small for images), one per theme.

const DB_NAME = 'iium-studio';
const STORE = 'photos';
// Longest side kept: enough for the sharpest phone wallpaper (2868px) without making
// storage or the saved image slow.
const MAX_SIDE = 2400;

const openDb = () =>
  new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('This browser can’t store photos.'));
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Photo storage is unavailable.'));
  });

const run = async (mode, action) => {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
};

export const savePhoto = (themeId, blob) => run('readwrite', (store) => store.put(blob, themeId));
export const loadPhoto = (themeId) => run('readonly', (store) => store.get(themeId)).catch(() => null);
export const deletePhoto = (themeId) => run('readwrite', (store) => store.delete(themeId)).catch(() => {});

const loadImage = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file couldn’t be opened as a photo.'));
    };
    img.src = url;
  });

const toBlob = (canvas, quality = 0.88) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The photo couldn’t be processed.'))), 'image/jpeg', quality)
  );

// A picked photo, shrunk to at most MAX_SIDE so it stores and draws quickly.
export const preparePhoto = async (file) => {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose a photo (JPG, PNG or HEIC).');
  const { img, url } = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return await toBlob(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
};

const toDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// The photo with blur and brightness baked in, as a data URL for the wallpaper.
// Baking it in (rather than CSS filters) makes the saved image match the preview on
// every browser. Blur is done by shrinking and enlarging the photo, which works even
// where canvas filters don't (older iOS). A data URL rather than a blob: URL, because
// the image saver re-fetches blob: URLs with a cache-busting query, which fails.
export const renderPhoto = async (blob, { blur = 0, brightness = 0 } = {}) => {
  const { img, url } = await loadImage(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (blur > 0) {
      const factor = 1 + blur * 0.9;
      const small = document.createElement('canvas');
      small.width = Math.max(1, Math.round(canvas.width / factor));
      small.height = Math.max(1, Math.round(canvas.height / factor));
      const sctx = small.getContext('2d');
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(img, 0, 0, small.width, small.height);
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    if (brightness) {
      ctx.fillStyle = brightness < 0 ? `rgba(0,0,0,${-brightness / 100})` : `rgba(255,255,255,${brightness / 100})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return await toDataUrl(await toBlob(canvas, 0.9));
  } finally {
    URL.revokeObjectURL(url);
  }
};

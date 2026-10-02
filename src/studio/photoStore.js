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

// --- Blur --------------------------------------------------------------------------
// A Gaussian blur made from three box blurs, which is smooth and looks the same on every
// browser (canvas blur filters are missing on older iPhones). It runs on a smaller copy
// of the photo, then is enlarged: after blurring there's no detail left to lose, so the
// result stays smooth while the work stays fast on a phone.

// Box widths whose three passes add up to a Gaussian of the given sigma.
const boxSizes = (sigma) => {
  let low = Math.floor(Math.sqrt((12 * sigma * sigma) / 3 + 1));
  if (low % 2 === 0) low--;
  const high = low + 2;
  const lowCount = Math.round((12 * sigma * sigma - 3 * low * low - 12 * low - 9) / (-4 * low - 4));
  return [0, 1, 2].map((i) => (i < lowCount ? low : high));
};

// One box blur along rows (step 4, `count` pixels per line) or columns, edges clamped.
const boxPass = (src, dst, lines, count, lineStep, step, radius) => {
  const scale = 1 / (radius * 2 + 1);
  for (let line = 0; line < lines; line++) {
    const base = line * lineStep;
    for (let c = 0; c < 3; c++) {
      const at = (i) => src[base + Math.min(count - 1, Math.max(0, i)) * step + c];
      let sum = 0;
      for (let k = -radius; k <= radius; k++) sum += at(k);
      for (let i = 0; i < count; i++) {
        dst[base + i * step + c] = sum * scale;
        sum += at(i + radius + 1) - at(i - radius);
      }
    }
  }
};

const gaussianBlur = (imageData, sigma) => {
  const { data, width, height } = imageData;
  let a = data;
  let b = new Uint8ClampedArray(data);
  for (const size of boxSizes(sigma)) {
    const radius = (size - 1) / 2;
    boxPass(a, b, height, width, width * 4, 4, radius); // rows
    boxPass(b, a, width, height, 4, width * 4, radius); // columns
  }
  return imageData;
};

// Blur strength in photo pixels: the slider's 0-20 scales with the photo's size, so a
// setting looks the same whatever the photo's resolution.
const blurSigma = (blur, longSide) => (blur * longSide) / 1000;

// The photo with blur and brightness baked in, as a data URL for the wallpaper, with
// its size (to line up a frosted copy behind a see-through card).
// Baking it in (rather than CSS filters) makes the saved image match the preview on
// every browser. A data URL rather than a blob: URL, because the image saver re-fetches
// blob: URLs with a cache-busting query, which fails.
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
      const longSide = Math.max(canvas.width, canvas.height);
      const sigma = blurSigma(blur, longSide);
      // Work small enough to be quick, but keep at least ~5px of blur on the small copy
      // so enlarging it shows no steps.
      const scale = Math.min(1, 5 / sigma, 1200 / longSide);
      const small = document.createElement('canvas');
      small.width = Math.max(1, Math.round(canvas.width * scale));
      small.height = Math.max(1, Math.round(canvas.height * scale));
      const sctx = small.getContext('2d');
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'high';
      sctx.drawImage(img, 0, 0, small.width, small.height);
      const pixels = sctx.getImageData(0, 0, small.width, small.height);
      sctx.putImageData(gaussianBlur(pixels, sigma * scale), 0, 0);
      ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(img, 0, 0);
    }
    if (brightness) {
      ctx.fillStyle = brightness < 0 ? `rgba(0,0,0,${-brightness / 100})` : `rgba(255,255,255,${brightness / 100})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return { url: await toDataUrl(await toBlob(canvas, 0.92)), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
};

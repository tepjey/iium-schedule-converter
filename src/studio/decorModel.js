// Stickers and sticky notes on a custom theme's wallpaper (2.0 Theme Studio). Positions
// and sizes are fractions of the wallpaper, so a decoration lands in the same place on
// every phone size. Everything read from storage or a share link goes through
// sanitizeDecor, so damaged data is dropped instead of breaking the page.

// Sticker ids, in the order the picker shows them. The artwork is in Decor.jsx.
export const STICKERS = [
  'khatam', 'star', 'heart', 'sparkle', 'moon', 'sun', 'cloud', 'rainbow',
  'flower', 'flower2', 'leaf', 'sprout', 'clover', 'cherry', 'citrus', 'coffee',
  'icecream', 'book', 'bookmark', 'pencil', 'graduation', 'lightbulb', 'laptop', 'headphones',
  'music', 'camera', 'plane', 'rocket', 'gift', 'crown', 'trophy', 'gem',
  'smile', 'cat', 'bird', 'feather', 'shell', 'snowflake', 'umbrella', 'zap',
];

export const NOTE_COLORS = ['#fff3a3', '#ffd6e0', '#cfe8ff', '#d6f5d6', '#e6dcff', '#ffe2c2', '#ffffff'];

export const STICKER_COLORS = [
  'theme', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#475569', '#ffffff',
];

export const MAX_DECOR = 30;
export const NOTE_MAX_LENGTH = 80;

const HEX = /^#[0-9a-f]{6}$/i;
const num = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const round = (n, places = 4) => Math.round(n * 10 ** places) / 10 ** places;

export const newDecorId = () => `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const sanitizeItem = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const kind = raw.kind === 'note' ? 'note' : raw.kind === 'sticker' ? 'sticker' : null;
  if (!kind) return null;
  if (kind === 'sticker' && !STICKERS.includes(raw.icon)) return null;
  const item = {
    id: typeof raw.id === 'string' && /^d[a-z0-9]{1,16}$/.test(raw.id) ? raw.id : newDecorId(),
    kind,
    // Center, as a fraction of the wallpaper's width and height.
    x: round(num(raw.x, 0, 1, 0.5)),
    y: round(num(raw.y, 0, 1, 0.5)),
    // Width, as a fraction of the wallpaper's width.
    size: round(num(raw.size, 0.05, 0.8, kind === 'note' ? 0.4 : 0.14)),
    rotate: Math.round(num(raw.rotate, -180, 180, 0)),
    layer: raw.layer === 'back' ? 'back' : 'front',
  };
  if (kind === 'sticker') {
    item.icon = raw.icon;
    item.color = raw.color === 'theme' || HEX.test(raw.color) ? raw.color : 'theme';
  } else {
    item.text = typeof raw.text === 'string' ? raw.text.slice(0, NOTE_MAX_LENGTH) : '';
    item.color = HEX.test(raw.color) ? raw.color : NOTE_COLORS[0];
  }
  return item;
};

export const sanitizeDecor = (raw) =>
  Array.isArray(raw) ? raw.map(sanitizeItem).filter(Boolean).slice(0, MAX_DECOR) : [];

// A new sticker or note in the middle of the wallpaper, turned slightly for a playful look.
export const newSticker = (icon) => sanitizeItem({ kind: 'sticker', icon, x: 0.5, y: 0.5, size: 0.16, rotate: -8, color: 'theme' });
export const newNote = () =>
  sanitizeItem({ kind: 'note', text: '', x: 0.5, y: 0.5, size: 0.42, rotate: -3, color: NOTE_COLORS[0] });

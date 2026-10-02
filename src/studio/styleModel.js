import { blockColors, mix } from '../utils/theme';

// How a theme is drawn, beyond its colors: card, class blocks, text and grid (2.0 Theme
// Studio). DEFAULT_STYLE is exactly the look before 2.0, and built-in themes use it, so
// they render unchanged.
export const DEFAULT_STYLE = {
  cardOpacity: 100, // 30-100; below 100 the background shows through the card
  cardFrost: true, // blur a photo background behind a see-through card
  cardRadius: 14,
  cardBorder: true,
  cardShadow: 'none', // none | soft | strong
  header: 'filled', // filled | plain
  hourLines: true,
  dayLines: true,
  footerCard: false, // put the semester line on a small card, for busy photos
  blockStyle: 'tint', // tint | solid | outline | glass
  blockRadius: 4,
  blockEdge: true,
  font: 'default', // a FONTS id; 'default' follows the Font setting in Look
  textSize: 'm', // s | m | l
  titleWeight: 'bold', // bold | medium
};

export const SHADOWS = {
  none: 'none',
  soft: '0 6px 18px -8px rgba(0,0,0,0.35)',
  strong: '0 14px 34px -10px rgba(0,0,0,0.6)',
};

export const TEXT_SCALE = { s: 0.9, m: 1, l: 1.15 };

// Extra fonts are bundled (the site's security policy only allows its own files) and
// loaded only when a theme uses them.
export const FONTS = {
  default: { name: 'Font setting', family: null },
  jakarta: { name: 'Jakarta Sans', family: '"Plus Jakarta Sans Variable", ui-sans-serif, sans-serif' },
  kufi: { name: 'Reem Kufi', family: '"Reem Kufi", "Plus Jakarta Sans Variable", sans-serif' },
  poppins: { name: 'Poppins', family: 'Poppins, ui-sans-serif, sans-serif', load: () => Promise.all([import('@fontsource/poppins/500.css'), import('@fontsource/poppins/600.css'), import('@fontsource/poppins/700.css')]) },
  nunito: { name: 'Nunito', family: '"Nunito Variable", ui-rounded, sans-serif', load: () => import('@fontsource-variable/nunito/wght.css') },
  space: { name: 'Space Grotesk', family: '"Space Grotesk Variable", ui-sans-serif, sans-serif', load: () => import('@fontsource-variable/space-grotesk/wght.css') },
  playfair: { name: 'Playfair', family: '"Playfair Display Variable", ui-serif, Georgia, serif', load: () => import('@fontsource-variable/playfair-display/wght.css') },
  serif: { name: 'Classic serif', family: 'ui-serif, Georgia, Cambria, "Times New Roman", serif' },
  caveat: { name: 'Caveat', family: '"Caveat Variable", cursive', load: () => import('@fontsource-variable/caveat/wght.css') },
};

const loaded = new Map();
// Load a font's files; resolves once its CSS is in (the browser fetches glyphs as used).
export const loadFont = (id) => {
  const font = FONTS[id];
  if (!font?.load) return Promise.resolve();
  if (!loaded.has(id)) loaded.set(id, font.load().catch(() => loaded.delete(id)));
  return loaded.get(id);
};

const pick = (value, options, fallback) => (options.includes(value) ? value : fallback);
const num = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n))) : fallback;
};
const bool = (value, fallback) => (typeof value === 'boolean' ? value : fallback);

export const sanitizeStyle = (raw) => {
  const s = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_STYLE;
  return {
    cardOpacity: num(s.cardOpacity, 30, 100, d.cardOpacity),
    cardFrost: bool(s.cardFrost, d.cardFrost),
    cardRadius: num(s.cardRadius, 0, 28, d.cardRadius),
    cardBorder: bool(s.cardBorder, d.cardBorder),
    cardShadow: pick(s.cardShadow, Object.keys(SHADOWS), d.cardShadow),
    header: pick(s.header, ['filled', 'plain'], d.header),
    hourLines: bool(s.hourLines, d.hourLines),
    dayLines: bool(s.dayLines, d.dayLines),
    footerCard: bool(s.footerCard, d.footerCard),
    blockStyle: pick(s.blockStyle, ['tint', 'solid', 'outline', 'glass'], d.blockStyle),
    blockRadius: num(s.blockRadius, 0, 12, d.blockRadius),
    blockEdge: bool(s.blockEdge, d.blockEdge),
    font: pick(s.font, Object.keys(FONTS), d.font),
    textSize: pick(s.textSize, Object.keys(TEXT_SCALE), d.textSize),
    titleWeight: pick(s.titleWeight, ['bold', 'medium'], d.titleWeight),
  };
};

const luminance = (hex) => {
  const v = parseInt(hex.slice(1), 16);
  const ch = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
};

const hexAlpha = (hex, alpha) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;

// A class block's colors for the chosen block style: fill, left edge, text and border.
// 'tint' is the original look (see blockColors in utils/theme.js).
export const blockLook = (courseColor, theme, style = DEFAULT_STYLE) => {
  const color = /^#[0-9a-f]{6}$/i.test(courseColor || '') ? courseColor : '#475569';
  const dark = theme.mode === 'dark';
  const tint = blockColors(color, theme);
  switch (style.blockStyle) {
    case 'solid': {
      const fill = dark ? mix(color, '#000000', 0.82) : color;
      // Black or white, whichever reads better on the course color.
      const l = luminance(fill);
      const text = (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? '#14171a' : '#ffffff';
      return { fill, edge: mix(color, dark ? '#ffffff' : '#000000', 0.7), text, border: 'none' };
    }
    case 'outline':
      return { fill: hexAlpha(theme.background, 0.6), edge: tint.edge, text: tint.text, border: `1px solid ${tint.edge}` };
    case 'glass':
      return {
        fill: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
        edge: tint.edge,
        text: tint.text,
        border: `1px solid ${dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.8)'}`,
      };
    default:
      return { ...tint, border: 'none' };
  }
};

// A block's four borders as separate properties (mixing the `border` shorthand with
// `borderLeft` makes React leave stale edges when the block style changes).
export const blockBorders = (look, edgeWidth) => ({
  borderTop: look.border,
  borderRight: look.border,
  borderBottom: look.border,
  borderLeft: edgeWidth ? `${edgeWidth}px solid ${look.edge}` : look.border,
});

// The card's fill: the card color, see-through when cardOpacity is below 100.
export const cardFill = (theme, style = DEFAULT_STYLE) =>
  style.cardOpacity >= 100 ? theme.background : hexAlpha(theme.background, style.cardOpacity / 100);

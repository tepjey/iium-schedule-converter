import { THEMES, mix } from '../utils/theme';

// A custom theme (2.0 Theme Studio). It resolves to the same set of colors as a built-in
// theme (see THEMES in utils/theme.js), so the timetable and wallpaper draw it with no
// special cases. Everything read from storage or a share link goes through
// sanitizeTheme, so damaged data falls back to defaults instead of breaking the page.

export const COLOR_KEYS = ['background', 'headerBackground', 'border', 'gridLine', 'text', 'mutedText', 'accent'];

export const COLOR_LABELS = {
  background: 'Card',
  headerBackground: 'Day header',
  border: 'Card border',
  gridLine: 'Grid lines',
  text: 'Text',
  mutedText: 'Secondary text',
  accent: 'Star mark',
};

export const BACKGROUND_TYPES = ['solid', 'gradient', 'photo'];

const HEX = /^#[0-9a-f]{6}$/i;

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

// --- Color helpers -------------------------------------------------------------------

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const isDark = (hex) => luminance(hex) < 0.18;

// Push a text color toward black or white until it reads on `bg` (WCAG AA is 4.5).
const readableOn = (fg, bg, target = 4.5) => {
  const toward = isDark(bg) ? '#ffffff' : '#000000';
  let color = fg;
  for (let step = 0; step < 20 && contrast(color, bg) < target; step++) color = mix(toward, color, 0.12);
  return color;
};

// --- Building themes -----------------------------------------------------------------

// A full palette from one color, so the simple editor only needs a color and light/dark.
export const paletteFromBase = (base, mode) => {
  if (mode === 'dark') {
    const ink = '#0b0e12';
    const background = mix(base, ink, 0.1);
    return {
      background,
      headerBackground: mix(base, ink, 0.16),
      border: mix(base, ink, 0.3),
      gridLine: mix(base, ink, 0.18),
      text: readableOn(mix(base, '#ffffff', 0.08), background, 7),
      mutedText: readableOn(mix(base, '#ffffff', 0.45), background),
      accent: mix(base, '#ffffff', 0.55),
      gradient: { from: mix(base, '#000000', 0.42), to: mix(base, '#000000', 0.88), angle: 180 },
    };
  }
  const background = mix(base, '#ffffff', 0.03);
  const headerBackground = mix(base, '#ffffff', 0.09);
  return {
    background,
    headerBackground,
    border: mix(base, '#ffffff', 0.24),
    gridLine: mix(base, '#ffffff', 0.13),
    text: readableOn(mix(base, '#0b0b0b', 0.3), headerBackground, 7),
    // Checked against the header, the darker of the two surfaces it sits on.
    mutedText: readableOn(mix(base, '#5f6368', 0.4), headerBackground),
    accent: base,
    gradient: { from: mix(base, '#ffffff', 0.32), to: mix(base, '#ffffff', 0.06), angle: 180 },
  };
};

const newId = () => `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// "linear-gradient(180deg, #d6e8e4 0%, ...)" -> its first and last colors and angle, so a
// built-in theme can be the starting point for a custom one.
const parseGradient = (css) => {
  const colors = (css.match(/#[0-9a-f]{6}/gi) || []).map((c) => c.toLowerCase());
  const angle = Number((css.match(/(-?\d+)deg/) || [])[1] ?? 180);
  if (colors.length < 2) return null;
  return { from: colors[0], via: colors.length > 2 ? colors[1] : '', to: colors[colors.length - 1], angle };
};

// A new custom theme that starts as an exact copy of a built-in one.
export const themeFromPreset = (presetId, name) => {
  const preset = THEMES[presetId] || THEMES.classic;
  const gradient = parseGradient(preset.wallpaperBackground);
  return sanitizeTheme({
    id: newId(),
    name: name || `My ${preset.name}`,
    base: preset.accent,
    colors: Object.fromEntries(COLOR_KEYS.map((key) => [key, preset[key]])),
    background: gradient
      ? { type: 'gradient', color: gradient.to, gradient }
      : { type: 'solid', color: preset.wallpaperBackground, gradient: { from: preset.background, to: preset.background, angle: 180 } },
  });
};

// Every field checked and defaulted. Unknown fields are dropped.
export const sanitizeTheme = (raw) => {
  const t = raw && typeof raw === 'object' ? raw : {};
  const fallback = THEMES.classic;
  const colors = {};
  for (const key of COLOR_KEYS) colors[key] = HEX.test(t.colors?.[key]) ? t.colors[key].toLowerCase() : fallback[key];

  const bg = t.background && typeof t.background === 'object' ? t.background : {};
  const g = bg.gradient && typeof bg.gradient === 'object' ? bg.gradient : {};
  const photo = bg.photo && typeof bg.photo === 'object' ? bg.photo : {};
  return {
    id: typeof t.id === 'string' && /^custom-[a-z0-9]{1,20}$/.test(t.id) ? t.id : newId(),
    name: (typeof t.name === 'string' && t.name.trim() ? t.name.trim() : 'My theme').slice(0, 30),
    base: HEX.test(t.base) ? t.base.toLowerCase() : colors.accent,
    colors,
    background: {
      type: BACKGROUND_TYPES.includes(bg.type) ? bg.type : 'gradient',
      color: HEX.test(bg.color) ? bg.color.toLowerCase() : colors.headerBackground,
      gradient: {
        from: HEX.test(g.from) ? g.from.toLowerCase() : colors.headerBackground,
        via: HEX.test(g.via) ? g.via.toLowerCase() : '',
        to: HEX.test(g.to) ? g.to.toLowerCase() : colors.background,
        angle: clamp(g.angle, 0, 359, 180),
      },
      photo: {
        blur: clamp(photo.blur, 0, 20, 0),
        // -60 darkens the photo, +60 fades it toward white, 0 leaves it as is.
        brightness: clamp(photo.brightness, -60, 60, 0),
      },
    },
  };
};

const gradientCss = ({ from, via, to, angle }) =>
  `linear-gradient(${angle}deg, ${from} 0%, ${via ? `${via} 50%, ` : ''}${to} 100%)`;

// The colors the timetable and wallpaper draw with. `photoUrl` is the student's
// processed background photo, when the theme uses one and it has loaded.
export const resolveTheme = (theme, photoUrl = '') => {
  const { colors, background } = theme;
  let wallpaperBackground;
  if (background.type === 'photo' && photoUrl) {
    wallpaperBackground = `url("${photoUrl}") center / cover no-repeat, ${background.color}`;
  } else if (background.type === 'solid' || background.type === 'photo') {
    wallpaperBackground = background.color;
  } else {
    wallpaperBackground = gradientCss(background.gradient);
  }
  return {
    ...colors,
    name: theme.name,
    // Class blocks are tinted for a light or dark card.
    mode: isDark(colors.background) ? 'dark' : 'light',
    wallpaperBackground,
    activeRing: colors.text,
  };
};

// --- Share links ---------------------------------------------------------------------
// The theme travels in the link itself (#theme=...), so no server is needed. A photo is
// too big for a link, so a photo theme is shared with its solid color instead.

const toBase64Url = (text) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fromBase64Url = (code) => {
  const binary = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

export const shareUrl = (theme) => {
  // The id stays behind: whoever opens the link gets their own copy.
  const shared = { ...theme, id: undefined };
  if (shared.background.type === 'photo') shared.background = { ...shared.background, type: 'solid' };
  const url = new URL(window.location.href);
  url.hash = `theme=${toBase64Url(JSON.stringify({ v: 1, ...shared }))}`;
  return url.toString();
};

// A theme from a share link's hash, or null if the hash isn't one or can't be read.
export const themeFromHash = (hash) => {
  const match = /^#theme=([A-Za-z0-9_-]{1,4000})$/.exec(hash || '');
  if (!match) return null;
  try {
    const data = JSON.parse(fromBase64Url(match[1]));
    return sanitizeTheme({ ...data, id: undefined });
  } catch {
    return null;
  }
};

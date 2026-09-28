// Colors for the timetable surface. Kept as plain hex (not Tailwind classes) so the
// exported image looks exactly like the on-screen preview. Themes only restyle the
// grid and wallpaper background; course colors stay under the user's control.
// `accent` colors the khatam star mark on exports.
export const THEMES = {
  classic: {
    name: 'Limestone',
    mode: 'light',
    background: '#ffffff',
    headerBackground: '#f6f8f7',
    border: '#dce3e0',
    gridLine: '#edf1ef',
    text: '#0d2f2e',
    mutedText: '#5a6d6a',
    wallpaperBackground: 'linear-gradient(180deg, #d6e8e4 0%, #f3f5f3 50%, #eef2f0 100%)',
    accent: '#b08a4e',
    activeRing: '#0d2f2e',
  },
  sakura: {
    name: 'Sakura',
    mode: 'light',
    background: '#fffbfc',
    headerBackground: '#fcf1f4',
    border: '#f1d5de',
    gridLine: '#f8e6ec',
    text: '#43172a',
    mutedText: '#93606f',
    wallpaperBackground: 'linear-gradient(180deg, #f8d7e3 0%, #fcf1f4 50%, #fff7f9 100%)',
    accent: '#c0788f',
    activeRing: '#43172a',
  },
  mint: {
    name: 'Mint',
    mode: 'light',
    background: '#fbfefc',
    headerBackground: '#eef8f2',
    border: '#cfe7da',
    gridLine: '#e3f2e9',
    text: '#12372a',
    mutedText: '#4d7a66',
    wallpaperBackground: 'linear-gradient(180deg, #cdeedb 0%, #eef8f2 50%, #f6fbf8 100%)',
    accent: '#6f9c80',
    activeRing: '#12372a',
  },
  midnight: {
    name: 'Midnight',
    mode: 'dark',
    background: '#0f1b26',
    headerBackground: '#152432',
    border: '#243646',
    gridLine: '#1a2a38',
    text: '#e8f0f3',
    mutedText: '#8ba0ae',
    wallpaperBackground: 'linear-gradient(180deg, #1b2a4a 0%, #0f1b26 50%, #070d13 100%)',
    accent: '#c9a46a',
    activeRing: '#e8f0f3',
  },
  amoled: {
    name: 'AMOLED',
    mode: 'dark',
    background: '#000000',
    headerBackground: '#0a0a0a',
    border: '#262626',
    gridLine: '#141414',
    text: '#f5f5f5',
    mutedText: '#8a8a8a',
    wallpaperBackground: '#000000',
    accent: '#b08a4e',
    activeRing: '#f5f5f5',
  },
  ocean: {
    name: 'Ocean',
    mode: 'dark',
    background: '#072a31',
    headerBackground: '#0b3740',
    border: '#155462',
    gridLine: '#0d3d47',
    text: '#e3f7f8',
    mutedText: '#7db3ba',
    wallpaperBackground: 'linear-gradient(180deg, #0f5257 0%, #072a31 50%, #03171b 100%)',
    accent: '#d2b07a',
    activeRing: '#e3f7f8',
  },
};

export const DEFAULT_THEME = { light: 'classic', dark: 'midnight' };

export const themesForMode = (mode) =>
  Object.entries(THEMES)
    .filter(([, t]) => t.mode === mode)
    .map(([id, t]) => ({ id, ...t }));

export const getTheme = (id) => THEMES[id] || THEMES.classic;

// Course colors, tuned to sit alongside the teal/sandstone palette. Each is the
// strong "edge" color; block fills and text are derived from it per theme.
export const COURSE_PALETTE = [
  { hex: '#0f766e', name: 'Mosque teal' },
  { hex: '#0369a1', name: 'Lagoon' },
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#9333ea', name: 'Plum' },
  { hex: '#e11d48', name: 'Rose' },
  { hex: '#d97706', name: 'Saffron' },
  { hex: '#65a30d', name: 'Olive' },
  { hex: '#475569', name: 'Slate' },
];

const toRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  const n = m ? parseInt(m[1], 16) : 0x475569;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// Blend `amount` of color a into color b.
const mix = (a, b, amount) => {
  const [ar, ag, ab] = toRgb(a);
  const [br, bg, bb] = toRgb(b);
  const c = (x, y) => Math.round(x * amount + y * (1 - amount)).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
};

// Soft tint + strong edge: a pale wash of the course color with a solid left edge
// and text shaded from the same hue, so every block reads calmly on any theme.
export const blockColors = (courseColor, theme) => {
  if (theme.mode === 'dark') {
    return {
      fill: mix(courseColor, theme.background, 0.24),
      edge: mix(courseColor, '#ffffff', 0.8),
      text: mix(courseColor, '#ffffff', 0.3),
    };
  }
  return {
    fill: mix(courseColor, theme.background, 0.13),
    edge: courseColor,
    text: mix(courseColor, '#000000', 0.55),
  };
};

// Output pixel sizes for the wallpaper export. The on-screen layout is rendered at
// width / pixelRatio CSS pixels and scaled up on export, like a real phone screen.
export const WALLPAPER_PRESETS = [
  { id: 'android', name: 'Android (1080 × 2400)', width: 1080, height: 2400, pixelRatio: 3 },
  { id: 'iphone', name: 'iPhone 15/16 (1179 × 2556)', width: 1179, height: 2556, pixelRatio: 3 },
  { id: 'iphone-max', name: 'iPhone Pro Max (1290 × 2796)', width: 1290, height: 2796, pixelRatio: 3 },
  { id: 'device', name: 'Match this device', width: 0, height: 0, pixelRatio: 0 },
];

export const resolveWallpaperSize = (presetId) => {
  const preset = WALLPAPER_PRESETS.find((p) => p.id === presetId) || WALLPAPER_PRESETS[0];
  if (preset.id !== 'device') return preset;

  // Use portrait orientation even if the device is currently held sideways.
  const ratio = window.devicePixelRatio || 1;
  const cssW = Math.min(window.screen.width, window.screen.height);
  const cssH = Math.max(window.screen.width, window.screen.height);
  return {
    ...preset,
    width: Math.round(cssW * ratio),
    height: Math.round(cssH * ratio),
    pixelRatio: ratio,
  };
};

import { PRO_PUBLIC_KEY } from './publicKey';

// SlipSnap Pro: a one-time RM5 unlock for the Theme Studio's extras. Anyone can try every
// feature in the Studio; Pro is only needed to save an image that uses one. Colors,
// gradients, the card, grid and text sizes stay free.

export const PRO_PRICE = 'RM5';
export const PRO_STORAGE_KEY = 'iium.pro';

// Fonts the site already had before 2.0 stay free; the rest are Pro.
const FREE_FONTS = ['default', 'jakarta', 'kufi'];

// The Pro features `theme` (a custom theme, see studio/themeModel.js) uses, as short
// names for the unlock dialog. Empty when it's all free.
export const proFeaturesOf = (theme) => {
  if (!theme) return [];
  const features = [];
  if (theme.background.type === 'photo') features.push('Photo background');
  if (theme.decor.some((item) => item.kind === 'sticker')) features.push('Stickers');
  if (theme.decor.some((item) => item.kind === 'note')) features.push('Sticky notes');
  if (!FREE_FONTS.includes(theme.style.font)) features.push('Extra font');
  if (theme.style.blockStyle !== 'tint') features.push('Block style');
  return features;
};

export const isProFont = (id) => !FREE_FONTS.includes(id);
export const isProBlockStyle = (id) => id !== 'tint';

// The same theme with the Pro features swapped for free ones: the photo for its solid
// color, no stickers or notes, the font setting and the original block style.
export const withoutPro = (theme) => ({
  ...theme,
  background: theme.background.type === 'photo' ? { ...theme.background, type: 'solid' } : theme.background,
  decor: [],
  style: {
    ...theme.style,
    font: isProFont(theme.style.font) ? 'default' : theme.style.font,
    blockStyle: 'tint',
  },
});

// --- Keys --------------------------------------------------------------------------------
// See server/proKey.js for the format. Checked here with the public key, so Pro works
// offline and without an account.

const fromBase64Url = (text) => {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

let publicKey = null;

// The key's payload ({ id, t }) if it's a genuine Pro key, otherwise null.
export const verifyProKey = async (key) => {
  const match = /^SNAP1\.([A-Za-z0-9_-]{10,400})\.([A-Za-z0-9_-]{40,200})$/.exec(String(key || '').trim());
  if (!match) return null;
  try {
    publicKey ||= await crypto.subtle.importKey('jwk', PRO_PUBLIC_KEY, { name: 'ECDSA', namedCurve: 'P-256' }, false, [
      'verify',
    ]);
    const valid = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      fromBase64Url(match[2]),
      new TextEncoder().encode(`SNAP1.${match[1]}`)
    );
    return valid ? JSON.parse(new TextDecoder().decode(fromBase64Url(match[1]))) : null;
  } catch {
    return null;
  }
};

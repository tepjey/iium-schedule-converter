import { useEffect, useState } from 'react';
import { deletePhoto, loadPhoto, renderPhoto, savePhoto } from './photoStore';
import { sanitizeTheme } from './themeModel';

// Custom themes live under their own keys, so the regular site (which shares this
// browser's storage with the beta) never sees values it doesn't understand.
const THEMES_KEY = 'iium.v2.themes';
const ACTIVE_KEY = 'iium.v2.activeTheme';
const MAX_THEMES = 20;

const loadThemes = () => {
  try {
    const list = JSON.parse(localStorage.getItem(THEMES_KEY));
    return Array.isArray(list) ? list.slice(0, MAX_THEMES).map(sanitizeTheme) : [];
  } catch {
    return [];
  }
};

const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode etc.); themes last until the page closes.
  }
};

// The background photo of `theme`, with its blur and brightness applied, as a data URL.
// `version` changes when a new photo is saved for the same theme.
export function usePhotoUrl(theme, photoBlob, version = 0) {
  // Tagged with its theme, so switching themes never shows the previous theme's photo.
  const [photo, setPhoto] = useState({ id: '', url: '' });
  const isPhoto = theme?.background.type === 'photo';
  const id = theme?.id;
  const { blur, brightness } = theme?.background.photo || {};

  useEffect(() => {
    if (!isPhoto) return undefined;
    let cancelled = false;
    (async () => {
      const blob = photoBlob || (await loadPhoto(id));
      if (!blob || cancelled) return;
      try {
        const made = await renderPhoto(blob, { blur, brightness });
        if (!cancelled) setPhoto({ id, url: made });
      } catch {
        // An unreadable photo leaves the theme's solid color showing.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isPhoto, id, blur, brightness, photoBlob, version]);

  return isPhoto && photo.id === id ? photo.url : '';
}

export function useCustomThemes() {
  const [themes, setThemes] = useState(loadThemes);
  const [activeId, setActiveId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_KEY) || '';
    } catch {
      return '';
    }
  });
  // Bumped after a photo is saved, so the active theme redraws with it.
  const [photoVersion, setPhotoVersion] = useState(0);

  useEffect(() => store(THEMES_KEY, JSON.stringify(themes)), [themes]);
  useEffect(() => store(ACTIVE_KEY, activeId), [activeId]);

  const active = themes.find((t) => t.id === activeId) || null;
  const activePhotoUrl = usePhotoUrl(active, null, photoVersion);

  // Save a new or edited theme (and its new photo, if one was picked) and use it.
  const saveTheme = async (theme, photoBlob = null) => {
    const clean = sanitizeTheme(theme);
    if (photoBlob) {
      await savePhoto(clean.id, photoBlob);
      setPhotoVersion((v) => v + 1);
    }
    setThemes((prev) => {
      const exists = prev.some((t) => t.id === clean.id);
      return exists ? prev.map((t) => (t.id === clean.id ? clean : t)) : [...prev, clean].slice(-MAX_THEMES);
    });
    setActiveId(clean.id);
    return clean;
  };

  const deleteTheme = (id) => {
    deletePhoto(id);
    setThemes((prev) => prev.filter((t) => t.id !== id));
    if (activeId === id) setActiveId('');
  };

  return {
    themes,
    active,
    activePhotoUrl,
    select: setActiveId,
    saveTheme,
    deleteTheme,
    canAddMore: themes.length < MAX_THEMES,
  };
}

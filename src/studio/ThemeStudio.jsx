import { useEffect, useRef, useState } from 'react';
import {
  Check, ChevronDown, Copy, Image, ImagePlus, LayoutGrid, Link2, Loader2, Palette, PanelTop, Smile, StickyNote, Trash2, Type, X,
} from 'lucide-react';
import { THEMES, lockScreenInsets } from '../utils/theme';
import { StickerArt } from './Decor';
import DecorEditor from './DecorEditor';
import { MAX_DECOR, NOTE_COLORS, NOTE_MAX_LENGTH, STICKERS, STICKER_COLORS, newDecorId, newNote, newSticker } from './decorModel';
import { preparePhoto } from './photoStore';
import {
  COLOR_KEYS,
  COLOR_LABELS,
  contrast,
  paletteFromBase,
  resolveTheme,
  sanitizeTheme,
  shareUrl,
  themeFromPreset,
} from './themeModel';
import { FONTS, blockBorders, blockLook, loadFont } from './styleModel';
import { usePhoto } from './useCustomThemes';

const BASE_COLORS = [
  '#0f766e', '#2563eb', '#7c3aed', '#db2777', '#e11d48', '#ea580c',
  '#ca8a04', '#16a34a', '#0891b2', '#475569', '#a16207', '#9f1239',
];

const DIRECTIONS = [
  { angle: 180, label: 'Top to bottom', arrow: '↓' },
  { angle: 135, label: 'Diagonal', arrow: '↘' },
  { angle: 90, label: 'Left to right', arrow: '→' },
  { angle: 45, label: 'Up diagonal', arrow: '↗' },
];

const BLOCK_STYLES = [
  { id: 'tint', label: 'Soft tint' },
  { id: 'solid', label: 'Solid' },
  { id: 'outline', label: 'Outline' },
  { id: 'glass', label: 'Glass' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-line bg-limestone p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
            value === opt.id ? 'bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(13,47,46,0.12)]' : 'text-muted hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <div className="mb-1.5 text-[0.8125rem] font-medium text-muted">{label}</div>
      {children}
      {hint && <p className="mt-1.5 text-[0.75rem] text-muted">{hint}</p>}
    </div>
  );
}

function ColorField({ label, value, onChange, warning }) {
  return (
    <label className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 shrink-0 cursor-pointer rounded border border-line bg-transparent p-0"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] text-ink">{label}</span>
        <span className="block font-mono text-[0.6875rem] text-muted uppercase">{value}</span>
      </span>
      {warning && <span className="shrink-0 rounded bg-danger/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-danger">{warning}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange, hint }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-0.5">
      <span>
        <span className="block text-[0.8125rem] text-ink">{label}</span>
        {hint && <span className="block text-[0.75rem] text-muted">{hint}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 rounded-full bg-line transition-colors peer-checked:bg-teal peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal after:absolute after:top-0.5 after:left-0.5 after:h-4 after:w-4 after:rounded-full after:bg-surface after:transition-transform peer-checked:after:translate-x-4"
      />
    </label>
  );
}

// Section tabs: six equal columns with an icon over a short label, so all of them fit
// on the narrowest phone without scrolling.
function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" aria-label="Studio sections" className="grid grid-cols-6 gap-1 rounded-xl bg-limestone p-1">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-0 py-1.5 text-[0.6875rem] leading-tight tracking-[-0.01em] transition-colors ${
            value === id ? 'bg-surface font-semibold text-teal shadow-[0_1px_2px_rgba(13,47,46,0.12)]' : 'text-muted hover:text-ink'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="max-w-full truncate">{label}</span>
        </button>
      ))}
    </div>
  );
}

function Advanced({ children }) {
  return (
    <details className="group rounded-lg border border-line">
      <summary className="panel-summary flex items-center justify-between px-3 py-2.5 text-[0.8125rem] font-semibold text-ink">
        Advanced
        <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-line p-3">{children}</div>
    </details>
  );
}

function Slider({ label, value, min, max, onChange, format }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-[0.8125rem] text-muted">
        {label}
        <span className="text-ink tabular-nums">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal"
      />
    </label>
  );
}

// The Theme Studio: edit a custom theme with a live preview of the wallpaper.
// `renderPreview(theme)` draws the student's own wallpaper with the draft theme.
export default function ThemeStudio({ initialTheme, isNew, size, renderPreview, onSave, onDelete, onClose }) {
  const dialogRef = useRef(null);
  const previewBoxRef = useRef(null);
  const fileRef = useRef(null);
  const [draft, setDraft] = useState(initialTheme);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [tab, setTab] = useState('colors');
  const [mode, setMode] = useState(() => resolveTheme(initialTheme).mode);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const photo = usePhoto(draft, photoBlob);
  const photoUrl = photo?.url || '';
  const resolved = resolveTheme(draft, photo);
  const width = size.width / size.pixelRatio;
  const height = size.height / size.pixelRatio;
  const scale = box.width ? Math.min(box.width / width, box.height / height, 1) : 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Focus the studio itself, not the close button (which would show a focus ring).
    dialog?.focus();
    // The page behind the full-screen studio shouldn't scroll along with it.
    const { overflow } = document.documentElement.style;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    const node = previewBoxRef.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) =>
      setBox({ width: entry.contentRect.width, height: entry.contentRect.height })
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const update = (change) => setDraft((prev) => sanitizeTheme(change(clone(prev))));
  const setStyle = (key, value) =>
    update((t) => {
      t.style[key] = value;
      return t;
    });
  const { style } = draft;

  // Stickers and notes: the one being edited, and changes to it.
  const [selectedDecor, setSelectedDecor] = useState(null);
  const decor = draft.decor;
  const selected = decor.find((d) => d.id === selectedDecor) || null;
  const changeDecor = (id, patch) =>
    update((t) => {
      t.decor = t.decor.map((d) => (d.id === id ? { ...d, ...patch } : d));
      return t;
    });
  const addDecor = (item) => {
    if (!item || decor.length >= MAX_DECOR) return;
    update((t) => {
      t.decor.push(item);
      return t;
    });
    setSelectedDecor(item.id);
  };
  const removeDecor = (id) => {
    update((t) => {
      t.decor = t.decor.filter((d) => d.id !== id);
      return t;
    });
    setSelectedDecor(null);
  };
  // Where the lock screen covers the wallpaper (clock at the top, buttons at the bottom).
  const lockArea = lockScreenInsets(size, 'none');
  const lockWarning =
    selected && selected.y < lockArea.top
      ? 'This sits where the lock screen clock is, so it may be hidden.'
      : selected && selected.y > 1 - lockArea.bottom
        ? 'This sits where the lock screen buttons are, so it may be covered.'
        : '';

  // Font buttons show each font, so load them all when the Text tab opens.
  useEffect(() => {
    if (tab === 'text') Object.keys(FONTS).forEach(loadFont);
  }, [tab]);

  const applyBase = (base, nextMode = mode) =>
    update((t) => {
      const { gradient, ...colors } = paletteFromBase(base, nextMode);
      t.base = base;
      t.colors = colors;
      t.background.gradient = { ...gradient, via: '' };
      t.background.color = gradient.to;
      return t;
    });

  const applyPreset = (presetId) => {
    const preset = themeFromPreset(presetId);
    setMode(resolveTheme(preset).mode);
    update((t) => ({ ...preset, id: t.id, name: t.name, background: { ...preset.background, photo: t.background.photo } }));
  };

  const pickPhoto = async (file) => {
    if (!file) return;
    setMessage('');
    setBusy(true);
    try {
      setPhotoBlob(await preparePhoto(file));
      update((t) => {
        t.background.type = 'photo';
        return t;
      });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setMessage('');
    try {
      await onSave(draft, photoBlob);
      dialogRef.current?.close();
    } catch {
      setMessage('The theme couldn’t be saved. Your browser may be out of space or in private mode.');
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(draft));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage('Couldn’t copy the link. Your browser blocked the clipboard.');
    }
  };

  const { colors, background } = draft;
  const textWarning = (key) => {
    if (key !== 'text' && key !== 'mutedText') return '';
    const ratio = Math.min(contrast(colors[key], colors.background), contrast(colors[key], colors.headerBackground));
    return ratio < 4.5 ? 'Hard to read' : '';
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="studio-title"
      tabIndex={-1}
      className="m-0 h-dvh max-h-none w-full max-w-none outline-none bg-limestone p-0 text-ink backdrop:bg-ink/60 lg:m-auto lg:h-[min(52rem,calc(100dvh-3rem))] lg:w-[min(64rem,calc(100vw-3rem))] lg:rounded-2xl lg:border lg:border-line"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close without saving"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-teal-wash hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 id="studio-title" className="sr-only">
            Theme Studio
          </h2>
          <input
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value.slice(0, 30) }))}
            onBlur={() => update((t) => t)}
            aria-label="Theme name"
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-base font-semibold text-ink hover:border-line focus:border-line"
          />
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep disabled:opacity-70"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Save
          </button>
        </header>

        {/* minmax(0, 1fr): the column never grows wider than the screen on a phone. */}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(14rem,42%)_1fr] lg:grid-cols-[minmax(0,1fr)_24rem] lg:grid-rows-1">
          <div ref={previewBoxRef} className="relative m-3 flex min-h-0 items-center justify-center sm:m-5">
            {scale > 0 && (
              <div
                style={{ width: width * scale + 8, height: height * scale + 8 }}
                className="overflow-hidden rounded-[1.75rem] border-4 border-ink bg-ink shadow-[0_18px_40px_-20px_rgba(13,47,46,0.5)]"
              >
                <div style={{ position: 'relative', width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                  {renderPreview(resolved)}
                  {tab === 'decor' && (
                    <DecorEditor
                      items={decor}
                      theme={resolved}
                      width={width}
                      height={height}
                      scale={scale}
                      selectedId={selectedDecor}
                      onSelect={setSelectedDecor}
                      onChange={changeDecor}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-col border-t border-line bg-surface lg:border-t-0 lg:border-l">
            <div className="px-4 pt-3 sm:px-5">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'colors', label: 'Colors', Icon: Palette },
                  { id: 'background', label: 'Backdrop', Icon: Image },
                  { id: 'card', label: 'Card', Icon: PanelTop },
                  { id: 'blocks', label: 'Blocks', Icon: LayoutGrid },
                  { id: 'text', label: 'Text', Icon: Type },
                  { id: 'decor', label: 'Stickers', Icon: Smile },
                ]}
              />
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
              {tab === 'colors' && (
                <>
                  <Field label="Base color" hint="Every color is made from this one. Fine-tune them under Advanced.">
                    <div className="flex flex-wrap items-center gap-2">
                      {BASE_COLORS.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => applyBase(hex)}
                          aria-label={`Base color ${hex}`}
                          className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                            draft.base === hex ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      <label
                        title="Any color"
                        className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted/60 text-xs text-muted hover:border-ink hover:text-ink"
                      >
                        +
                        <input
                          type="color"
                          value={draft.base}
                          onChange={(e) => applyBase(e.target.value)}
                          className="sr-only"
                          aria-label="Any base color"
                        />
                      </label>
                    </div>
                  </Field>

                  <Field label="Light or dark">
                    <Segmented
                      label="Light or dark"
                      value={mode}
                      onChange={(next) => {
                        setMode(next);
                        applyBase(draft.base, next);
                      }}
                      options={[
                        { id: 'light', label: 'Light' },
                        { id: 'dark', label: 'Dark' },
                      ]}
                    />
                  </Field>

                  <Field label="Or start from a built-in theme">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(THEMES).map(([id, t]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => applyPreset(id)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pr-2.5 pl-1 text-[0.8125rem] text-ink transition-colors hover:border-teal/40"
                        >
                          <span className="h-4 w-4 rounded-full border border-line" style={{ background: t.wallpaperBackground }} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Advanced>
                    {COLOR_KEYS.map((key) => (
                      <ColorField
                        key={key}
                        label={COLOR_LABELS[key]}
                        value={colors[key]}
                        warning={textWarning(key)}
                        onChange={(value) =>
                          update((t) => {
                            t.colors[key] = value;
                            return t;
                          })
                        }
                      />
                    ))}
                  </Advanced>
                </>
              )}

              {tab === 'background' && (
                <>
                  <Segmented
                    label="Background type"
                    value={background.type}
                    onChange={(type) =>
                      update((t) => {
                        t.background.type = type;
                        return t;
                      })
                    }
                    options={[
                      { id: 'solid', label: 'Solid' },
                      { id: 'gradient', label: 'Gradient' },
                      { id: 'photo', label: 'Photo' },
                    ]}
                  />

                  {background.type === 'solid' && (
                    <ColorField
                      label="Background color"
                      value={background.color}
                      onChange={(value) =>
                        update((t) => {
                          t.background.color = value;
                          return t;
                        })
                      }
                    />
                  )}

                  {background.type === 'gradient' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {['from', 'to'].map((end) => (
                          <ColorField
                            key={end}
                            label={end === 'from' ? 'Start' : 'End'}
                            value={background.gradient[end]}
                            onChange={(value) =>
                              update((t) => {
                                t.background.gradient[end] = value;
                                return t;
                              })
                            }
                          />
                        ))}
                      </div>
                      <Field label="Direction">
                        <div className="flex gap-2">
                          {DIRECTIONS.map((d) => (
                            <button
                              key={d.angle}
                              type="button"
                              aria-label={d.label}
                              aria-pressed={background.gradient.angle === d.angle}
                              onClick={() =>
                                update((t) => {
                                  t.background.gradient.angle = d.angle;
                                  return t;
                                })
                              }
                              className={`h-9 w-11 rounded-lg border text-base transition-colors ${
                                background.gradient.angle === d.angle
                                  ? 'border-teal bg-teal text-limestone'
                                  : 'border-line bg-surface text-ink hover:border-teal/40'
                              }`}
                            >
                              {d.arrow}
                            </button>
                          ))}
                        </div>
                      </Field>
                      <Advanced>
                        <label className="flex items-center gap-2 text-[0.8125rem] text-ink">
                          <input
                            type="checkbox"
                            checked={Boolean(background.gradient.via)}
                            onChange={(e) =>
                              update((t) => {
                                t.background.gradient.via = e.target.checked ? colors.accent : '';
                                return t;
                              })
                            }
                            className="h-4 w-4 accent-teal"
                          />
                          Add a middle color
                        </label>
                        {background.gradient.via && (
                          <ColorField
                            label="Middle"
                            value={background.gradient.via}
                            onChange={(value) =>
                              update((t) => {
                                t.background.gradient.via = value;
                                return t;
                              })
                            }
                          />
                        )}
                        <Slider
                          label="Angle"
                          value={background.gradient.angle}
                          min={0}
                          max={359}
                          format={(v) => `${v}°`}
                          onChange={(angle) =>
                            update((t) => {
                              t.background.gradient.angle = angle;
                              return t;
                            })
                          }
                        />
                      </Advanced>
                    </>
                  )}

                  {background.type === 'photo' && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={busy}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-teal/50 bg-teal-wash/40 px-4 py-3 text-sm font-semibold text-teal transition-colors hover:bg-teal-wash"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        {photoUrl ? 'Choose a different photo' : 'Choose a photo'}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          pickPhoto(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                      <Slider
                        label="Blur"
                        value={background.photo.blur}
                        min={0}
                        max={20}
                        onChange={(blur) =>
                          update((t) => {
                            t.background.photo.blur = blur;
                            return t;
                          })
                        }
                      />
                      <Slider
                        label="Darken or lighten"
                        value={background.photo.brightness}
                        min={-60}
                        max={60}
                        format={(v) => (v === 0 ? 'Off' : v < 0 ? `Darker ${-v}%` : `Lighter ${v}%`)}
                        onChange={(brightness) =>
                          update((t) => {
                            t.background.photo.brightness = brightness;
                            return t;
                          })
                        }
                      />
                      <p className="text-[0.75rem] text-muted">
                        Your photo stays on this device. It isn’t uploaded or included in share links.
                      </p>
                    </>
                  )}
                </>
              )}

              {tab === 'card' && (
                <>
                  <Slider
                    label="Card opacity"
                    value={style.cardOpacity}
                    min={30}
                    max={100}
                    format={(v) => (v === 100 ? 'Solid' : `${v}%`)}
                    onChange={(v) => setStyle('cardOpacity', v)}
                  />
                  {style.cardOpacity < 100 && background.type === 'photo' && (
                    <Toggle
                      label="Frosted glass"
                      hint="Blur the photo behind the card"
                      checked={style.cardFrost}
                      onChange={(v) => setStyle('cardFrost', v)}
                    />
                  )}
                  <Slider
                    label="Corner roundness"
                    value={style.cardRadius}
                    min={0}
                    max={28}
                    onChange={(v) => setStyle('cardRadius', v)}
                  />
                  <Advanced>
                    <Toggle label="Border" checked={style.cardBorder} onChange={(v) => setStyle('cardBorder', v)} />
                    <Field label="Shadow">
                      <Segmented
                        label="Shadow"
                        value={style.cardShadow}
                        onChange={(v) => setStyle('cardShadow', v)}
                        options={[
                          { id: 'none', label: 'None' },
                          { id: 'soft', label: 'Soft' },
                          { id: 'strong', label: 'Strong' },
                        ]}
                      />
                    </Field>
                    <Field label="Day header">
                      <Segmented
                        label="Day header"
                        value={style.header}
                        onChange={(v) => setStyle('header', v)}
                        options={[
                          { id: 'filled', label: 'Filled' },
                          { id: 'plain', label: 'Plain' },
                        ]}
                      />
                    </Field>
                    <Toggle label="Hour lines" checked={style.hourLines} onChange={(v) => setStyle('hourLines', v)} />
                    <Toggle label="Day lines" checked={style.dayLines} onChange={(v) => setStyle('dayLines', v)} />
                    <Toggle
                      label="Semester line on a card"
                      hint="Easier to read over a busy photo"
                      checked={style.footerCard}
                      onChange={(v) => setStyle('footerCard', v)}
                    />
                  </Advanced>
                </>
              )}

              {tab === 'blocks' && (
                <>
                  <Field label="Class block style">
                    <div className="grid grid-cols-2 gap-2">
                      {BLOCK_STYLES.map((option) => {
                        const look = blockLook('#2563eb', resolved, { ...style, blockStyle: option.id });
                        const selected = style.blockStyle === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setStyle('blockStyle', option.id)}
                            className={`rounded-lg border p-1.5 text-left transition-colors ${
                              selected ? 'border-teal ring-1 ring-teal' : 'border-line hover:border-teal/40'
                            }`}
                          >
                            <span className="block rounded-md p-2" style={{ background: resolved.wallpaperBackground }}>
                              <span className="block rounded p-1.5" style={{ background: resolved.background }}>
                                <span
                                  className="block px-1.5 py-1 text-[0.6875rem] leading-tight font-bold"
                                  style={{
                                    background: look.fill,
                                    color: look.text,
                                    ...blockBorders(look, style.blockEdge ? 2 : 0),
                                    borderRadius: style.blockRadius,
                                  }}
                                >
                                  DSA
                                  <span className="block font-normal opacity-85">10:00 AM</span>
                                </span>
                              </span>
                            </span>
                            <span className={`block px-0.5 pt-1.5 text-xs ${selected ? 'font-semibold text-ink' : 'text-muted'}`}>
                              {option.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Slider
                    label="Corner roundness"
                    value={style.blockRadius}
                    min={0}
                    max={12}
                    onChange={(v) => setStyle('blockRadius', v)}
                  />
                  <Advanced>
                    <Toggle
                      label="Colored edge"
                      hint="The strip of course color on the left"
                      checked={style.blockEdge}
                      onChange={(v) => setStyle('blockEdge', v)}
                    />
                  </Advanced>
                </>
              )}

              {tab === 'text' && (
                <>
                  <Field label="Font">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(FONTS).map(([id, font]) => (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={style.font === id}
                          onClick={() => setStyle('font', id)}
                          className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                            style.font === id ? 'border-teal bg-teal-wash/50 ring-1 ring-teal' : 'border-line hover:border-teal/40'
                          }`}
                        >
                          <span
                            className="block text-base leading-tight text-ink"
                            style={font.family ? { fontFamily: font.family } : undefined}
                          >
                            {id === 'default' ? 'Aa' : 'Mon 10:00'}
                          </span>
                          <span className="block text-[0.75rem] text-muted">{font.name}</span>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Text size">
                    <Segmented
                      label="Text size"
                      value={style.textSize}
                      onChange={(v) => setStyle('textSize', v)}
                      options={[
                        { id: 's', label: 'Small' },
                        { id: 'm', label: 'Medium' },
                        { id: 'l', label: 'Large' },
                      ]}
                    />
                  </Field>
                  <Advanced>
                    <Field label="Course names">
                      <Segmented
                        label="Course name weight"
                        value={style.titleWeight}
                        onChange={(v) => setStyle('titleWeight', v)}
                        options={[
                          { id: 'bold', label: 'Bold' },
                          { id: 'medium', label: 'Medium' },
                        ]}
                      />
                    </Field>
                  </Advanced>
                </>
              )}

              {tab === 'decor' && (
                <>
                  <p className="text-[0.8125rem] text-muted">
                    Drag on the preview to move. Drag the round handle to resize and turn.
                  </p>

                  {selected && (
                    <div className="space-y-3 rounded-lg border border-teal/40 bg-teal-wash/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[0.8125rem] font-semibold text-ink">
                          {selected.kind === 'note' ? 'Sticky note' : 'Sticker'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedDecor(null)}
                          className="rounded-md px-2 py-1 text-[0.8125rem] font-medium text-teal hover:bg-teal-wash"
                        >
                          Done
                        </button>
                      </div>

                      {selected.kind === 'note' && (
                        <label className="block text-[0.8125rem] text-muted">
                          Text
                          <textarea
                            value={selected.text}
                            onChange={(e) => changeDecor(selected.id, { text: e.target.value.slice(0, NOTE_MAX_LENGTH) })}
                            maxLength={NOTE_MAX_LENGTH}
                            rows={2}
                            placeholder="e.g. Final exam 14 Dec"
                            className="mt-1 block w-full resize-none rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink"
                          />
                          <span className="mt-0.5 block text-right text-[0.6875rem]">
                            {selected.text.length}/{NOTE_MAX_LENGTH}
                          </span>
                        </label>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {(selected.kind === 'note' ? NOTE_COLORS : STICKER_COLORS).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => changeDecor(selected.id, { color: c })}
                            aria-label={c === 'theme' ? 'Theme color' : `Color ${c}`}
                            className={`h-6 w-6 rounded-full border border-line ${
                              selected.color === c ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                            }`}
                            style={{ background: c === 'theme' ? resolved.accent : c }}
                          >
                            {c === 'theme' && <span className="sr-only">Theme</span>}
                          </button>
                        ))}
                      </div>

                      <Slider
                        label="Size"
                        value={Math.round(selected.size * 100)}
                        min={selected.kind === 'note' ? 20 : 5}
                        max={selected.kind === 'note' ? 80 : 50}
                        format={(v) => `${v}%`}
                        onChange={(v) => changeDecor(selected.id, { size: v / 100 })}
                      />
                      <Slider
                        label="Turn"
                        value={selected.rotate}
                        min={-180}
                        max={180}
                        format={(v) => `${v}°`}
                        onChange={(v) => changeDecor(selected.id, { rotate: v })}
                      />
                      <Toggle
                        label="Behind the timetable"
                        checked={selected.layer === 'back'}
                        onChange={(v) => changeDecor(selected.id, { layer: v ? 'back' : 'front' })}
                      />
                      {lockWarning && <p className="text-[0.75rem] text-brass">{lockWarning}</p>}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={decor.length >= MAX_DECOR}
                          onClick={() =>
                            addDecor({
                              ...selected,
                              id: newDecorId(),
                              x: Math.min(1, selected.x + 0.05),
                              y: Math.min(1, selected.y + 0.04),
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium text-teal hover:bg-teal-wash disabled:opacity-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => removeDecor(selected.id)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[0.8125rem] font-medium text-muted hover:bg-danger/5 hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => addDecor(newNote())}
                    disabled={decor.length >= MAX_DECOR}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-teal/50 bg-teal-wash/40 px-4 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal-wash disabled:opacity-50"
                  >
                    <StickyNote className="h-4 w-4" />
                    Add a sticky note
                  </button>

                  <Field label="Add a sticker">
                    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
                      {STICKERS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => addDecor(newSticker(icon))}
                          disabled={decor.length >= MAX_DECOR}
                          aria-label={`Add ${icon} sticker`}
                          className="aspect-square rounded-lg border border-line bg-limestone p-1.5 transition-colors hover:border-teal/40 disabled:opacity-50"
                        >
                          <StickerArt icon={icon} color={resolved.accent} />
                        </button>
                      ))}
                    </div>
                  </Field>
                  {decor.length >= MAX_DECOR && (
                    <p className="text-[0.75rem] text-muted">That’s the most a wallpaper can hold ({MAX_DECOR}).</p>
                  )}
                </>
              )}

              {message && (
                <p role="alert" className="text-[0.8125rem] text-danger">
                  {message}
                </p>
              )}
            </div>

            <footer className="flex items-center gap-2 border-t border-line px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal-wash"
              >
                {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                {copied ? 'Link copied' : 'Copy share link'}
              </button>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete “${draft.name}”? This can’t be undone.`)) {
                      onDelete(draft.id);
                      dialogRef.current?.close();
                    }
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger/5 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              )}
            </footer>
          </div>
        </div>
      </div>
    </dialog>
  );
}

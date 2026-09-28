import { ChevronDown, Download, Loader2 } from 'lucide-react';
import { COURSE_PALETTE, WALLPAPER_GROUPS, WALLPAPER_PRESETS, presetLabel, themesForMode } from '../utils/theme';

const FONT_OPTIONS = [
  { id: 'font-sans', name: 'Jakarta Sans' },
  { id: 'font-kufi', name: 'Reem Kufi' },
  { id: 'font-serif', name: 'Serif' },
];

const selectClass =
  'w-full appearance-none rounded-lg border border-line bg-surface px-3 py-2 pr-9 text-sm text-ink transition-colors hover:border-teal/40';

function Section({ title, children }) {
  return (
    <details open className="border-b border-line last:border-b-0">
      <summary className="panel-summary flex items-center justify-between py-4 text-[0.9375rem] font-semibold text-ink">
        {title}
        <ChevronDown className="panel-chevron h-4 w-4 text-muted transition-transform" />
      </summary>
      <div className="space-y-4 pb-5">{children}</div>
    </details>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1.5 text-[0.8125rem] font-medium text-muted">{label}</div>
      {children}
    </div>
  );
}

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

function Select({ value, onChange, label, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className={selectClass}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

// A miniature of the theme: its wallpaper backdrop with a small grid card on top.
function ThemeSwatch({ theme, selected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`rounded-lg border p-1 text-left transition-colors ${
        selected ? 'border-teal ring-1 ring-teal' : 'border-line hover:border-teal/40'
      }`}
    >
      <span
        className="flex h-12 items-end justify-center rounded-md px-2 pb-1.5"
        style={{ background: theme.wallpaperBackground }}
      >
        <span
          className="block h-6 w-full rounded-[3px]"
          style={{ background: theme.background, border: `1px solid ${theme.border}` }}
        />
      </span>
      <span className={`block px-1 pt-1.5 pb-0.5 text-xs ${selected ? 'font-semibold text-ink' : 'text-muted'}`}>
        {theme.name}
      </span>
    </button>
  );
}

export function ExportButton({ onExport, isExporting, layout, className = '' }) {
  return (
    <button
      type="button"
      onClick={onExport}
      disabled={isExporting}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-teal px-4 py-3 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {isExporting ? 'Saving image…' : layout === 'wallpaper' ? 'Save wallpaper' : 'Save timetable'}
    </button>
  );
}

export default function ControlPanel({
  courses,
  activeCourseId,
  onSelectCourse,
  onColorChange,
  onExport,
  isExporting,
  exportError,
  fontFamily,
  setFontFamily,
  themeMode,
  setThemeMode,
  theme,
  setTheme,
  timeFormat,
  setTimeFormat,
  layout,
  setLayout,
  wallpaperPreset,
  setWallpaperPreset,
  showOrientation,
  orientation,
  setOrientation,
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5">
      <Section title="Layout">
        <Segmented
          label="Layout"
          value={layout}
          onChange={setLayout}
          options={[
            { id: 'wallpaper', label: 'Wallpaper' },
            { id: 'standard', label: 'Timetable' },
          ]}
        />
        {layout === 'wallpaper' && (
          <Field label="Phone model">
            <Select value={wallpaperPreset} onChange={setWallpaperPreset} label="Phone model">
              {WALLPAPER_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {WALLPAPER_PRESETS.filter((p) => p.group === group).map((p) => (
                    <option key={p.id} value={p.id}>
                      {presetLabel(p)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
        )}
        {layout === 'wallpaper' && showOrientation && (
          <Field label="Orientation">
            <Segmented
              label="Orientation"
              value={orientation}
              onChange={setOrientation}
              options={[
                { id: 'portrait', label: 'Portrait' },
                { id: 'landscape', label: 'Landscape' },
              ]}
            />
          </Field>
        )}
      </Section>

      <Section title="Look">
        <Segmented
          label="Light or dark"
          value={themeMode}
          onChange={setThemeMode}
          options={[
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ]}
        />
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2">
          {themesForMode(themeMode).map((t) => (
            <ThemeSwatch key={t.id} theme={t} selected={theme === t.id} onSelect={() => setTheme(t.id)} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Clock">
            <Segmented
              label="Clock"
              value={timeFormat}
              onChange={setTimeFormat}
              options={[
                { id: '12h', label: '12h' },
                { id: '24h', label: '24h' },
              ]}
            />
          </Field>
          <Field label="Font">
            <Select value={fontFamily} onChange={setFontFamily} label="Font">
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Courses">
        <ul className="-mx-2">
          {courses.map((course) => {
            const selected = course.id === activeCourseId;
            return (
              <li key={course.id}>
                <button
                  type="button"
                  onClick={() => onSelectCourse(selected ? null : course.id)}
                  aria-expanded={selected}
                  className={`flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                    selected ? 'bg-teal-wash' : 'hover:bg-limestone'
                  }`}
                >
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: course.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-ink">{course.code}</span>
                      <span className="text-xs text-muted tabular-nums">Section {course.section}</span>
                    </span>
                    <span className="block truncate text-[0.8125rem] text-muted">
                      {course.title}
                      {course.isUnscheduled ? ' (no class time)' : ''}
                    </span>
                  </span>
                </button>

                {selected && (
                  <div className="flex flex-wrap items-center gap-2 px-2 pt-2 pb-3 pl-8">
                    {COURSE_PALETTE.map(({ hex, name }) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => onColorChange(hex)}
                        aria-label={name}
                        title={name}
                        className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${
                          course.color === hex ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <label
                      title="Custom color"
                      className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-dashed border-muted/60 text-xs text-muted hover:border-ink hover:text-ink"
                    >
                      +
                      <input
                        type="color"
                        value={course.color}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="sr-only"
                        aria-label="Custom color"
                      />
                    </label>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <div className="hidden pt-1 pb-5 lg:block">
        <ExportButton onExport={onExport} isExporting={isExporting} layout={layout} className="w-full" />
        {exportError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {exportError}
          </p>
        )}
      </div>
    </div>
  );
}

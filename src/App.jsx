import { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import ControlPanel, { ExportButton } from './components/ControlPanel';
import Faq from './components/Faq';
import Khatam from './components/Khatam';
import PDFUploader from './components/PDFUploader';
import ReportLink from './components/ReportLink';
import SavePreview from './components/SavePreview';
import SupportNudge from './components/SupportNudge';
import Timetable from './components/Timetable';
import WallpaperView from './components/WallpaperView';
import WhatsNew from './components/WhatsNew';
import { GITHUB_USERNAME, SUPPORT_URL } from './config';
import { failureReason, trackEvent } from './utils/analytics';
import { shouldAnnounce } from './utils/announcement';
import { shouldNudge } from './utils/supportNudge';
import { applySavedEdits, saveEdits, visibleCourses } from './utils/courseEdits';
import { recordError } from './utils/diagnostics';
import { downloadImage, isInAppBrowser, isTouchDevice, renderImage, shareImage } from './utils/exporter';
import { layoutLanes } from './utils/parser';
import {
  DEFAULT_THEME,
  LOCK_WIDGETS,
  THEMES,
  getTheme,
  lockScreenPlatform,
  resolveWallpaperSize,
} from './utils/theme';

// Display preferences are remembered in this browser between visits.
function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      return localStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Storage unavailable (private mode etc.); preferences just won't persist.
    }
  }, [key, value]);
  return [value, setValue];
}

// Width of an element, kept up to date as the layout changes. Returns a callback ref so
// measuring starts whenever the element appears (the preview only exists after upload).
function useElementWidth() {
  const [node, setNode] = useState(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width];
}

export default function App() {
  const [courses, setCourses] = useState([]);
  const [semester, setSemester] = useState('');
  const [partialReport, setPartialReport] = useState(null);
  const [fontFamily, setFontFamily] = usePersistentState('iium.font', 'font-sans');
  const [themeMode, setThemeMode] = usePersistentState('iium.theme', 'light');
  // Remember the last theme picked in each mode, so toggling Light/Dark restores it.
  const [lightTheme, setLightTheme] = usePersistentState('iium.lightTheme', DEFAULT_THEME.light);
  const [darkTheme, setDarkTheme] = usePersistentState('iium.darkTheme', DEFAULT_THEME.dark);
  const [timeFormat, setTimeFormat] = usePersistentState('iium.timeFormat', '12h');
  const [layout, setLayout] = usePersistentState('iium.layout', 'wallpaper');
  // On a phone or tablet, sizing the wallpaper to the device itself is the best default;
  // a laptop's screen would give a landscape-derived size, so fall back to a common phone size.
  const [wallpaperPreset, setWallpaperPreset] = usePersistentState(
    'iium.wallpaperPreset',
    window.matchMedia?.('(pointer: coarse)').matches ? 'device' : 'android'
  );
  const [orientation, setOrientation] = usePersistentState('iium.orientation', 'portrait');
  // 'all' shows Mon-Fri; 'class' leaves out weekdays with no class, such as a free Friday.
  const [days, setDays] = usePersistentState('iium.days', 'all');
  // Where the iPhone/iPad lock screen widgets sit, so the wallpaper keeps that area clear.
  const [lockWidgets, setLockWidgets] = usePersistentState('iium.lockWidgets', 'top');
  // What each class block is titled with: 'code', 'short' (e.g. DSA) or 'both'.
  const [courseLabel, setCourseLabel] = usePersistentState('iium.courseLabel', 'code');
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  // The rendered image and its object URL, when it's shown in the save preview.
  // The "buy me a coffee" note shown after a save (see utils/supportNudge.js).
  const [showNudge, setShowNudge] = useState(false);
  const [savePreview, setSavePreview] = useState(null);
  const [showWhatsNew, setShowWhatsNew] = useState(shouldAnnounce);
  const timetableRef = useRef(null);
  const wallpaperRef = useRef(null);
  const [previewAreaRef, previewAreaWidth] = useElementWidth();

  const mode = themeMode === 'dark' ? 'dark' : 'light';
  const pickedTheme = mode === 'dark' ? darkTheme : lightTheme;
  const theme = THEMES[pickedTheme]?.mode === mode ? pickedTheme : DEFAULT_THEME[mode];
  const setTheme = mode === 'dark' ? setDarkTheme : setLightTheme;
  const colors = getTheme(theme);
  const wallpaperSize = resolveWallpaperSize(wallpaperPreset, orientation);
  const platform = lockScreenPlatform(wallpaperSize);
  const widgetPlacement = LOCK_WIDGETS.includes(lockWidgets) ? lockWidgets : 'top';
  const classDaysOnly = days === 'class';
  const label = ['code', 'short', 'both'].includes(courseLabel) ? courseLabel : 'code';

  // Shrink the device preview to fit its column (landscape iPads are wide); the
  // export itself is unaffected. 46px covers the card's padding and border plus the frame.
  const wallpaperWidth = wallpaperSize.width / wallpaperSize.pixelRatio;
  const wallpaperHeight = wallpaperSize.height / wallpaperSize.pixelRatio;
  const previewScale = previewAreaWidth ? Math.min(1, (previewAreaWidth - 46) / wallpaperWidth) : 1;

  const handleDataParsed = (parsed) => {
    // Bring back the colors, short names and hidden class times from an earlier upload.
    setCourses(applySavedEdits(parsed.courses));
    setSemester(parsed.semester);
    setActiveCourseId(null);

    // The slip was read, but some class rows weren't understood, so classes may be
    // missing. Count the reason (no slip content) and offer a GitHub report.
    const rows = parsed.diagnostics.unreadableRows;
    if (rows.length) {
      const reason = failureReason({ parsed });
      trackEvent(`slip-partial: ${reason}`, 'Slip partly read');
      setPartialReport({ reason, rows });
    } else {
      setPartialReport(null);
    }
  };

  // Change one course and remember the change on this device.
  const editCourse = (courseId, change) => {
    if (!courseId) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const updated = { ...course, ...change(course) };
    saveEdits([updated]);
    setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
  };

  const handleColorChange = (color) => editCourse(activeCourseId, () => ({ color }));

  const handleShortNameChange = (shortName) => editCourse(activeCourseId, () => ({ shortName }));

  // Class times the student enters themselves, e.g. when the slip has none yet.
  const handleAddSlots = (courseId, slots) =>
    editCourse(courseId, (course) => ({
      schedules: [...course.schedules, ...slots.map((slot) => ({ ...slot, added: true }))],
    }));

  const handleRemoveSlot = (courseId, slotIndex) =>
    editCourse(courseId, (course) => ({ schedules: course.schedules.filter((_, i) => i !== slotIndex) }));

  // Show or hide one class time, e.g. a tutorial slot the student doesn't attend.
  const handleToggleSlot = (courseId, slotIndex) =>
    editCourse(courseId, (course) => ({
      schedules: course.schedules.map((s, i) => (i === slotIndex ? { ...s, hidden: !s.hidden } : s)),
    }));

  const handleExport = async () => {
    // Commit the render that hides the selection outline before capturing,
    // so the exported image never shows which course was selected.
    flushSync(() => {
      setIsExporting(true);
      setExportError('');
    });
    let file;
    try {
      file =
        layout === 'wallpaper'
          ? await renderImage(wallpaperRef, {
              filename: `SlipSnap_Wallpaper_${wallpaperSize.width}x${wallpaperSize.height}.png`,
              pixelRatio: wallpaperSize.pixelRatio,
              outputWidth: wallpaperSize.width,
              outputHeight: wallpaperSize.height,
            })
          : await renderImage(timetableRef, {
              filename: 'SlipSnap_Timetable.png',
              pixelRatio: 3,
              backgroundColor: colors.background,
            });
    } catch (err) {
      console.error('Export failed:', err);
      recordError(err);
      trackEvent(`save-failed: ${String(err?.message || 'unknown').slice(0, 60)}`, 'Image could not be created');
      setExportError(`The image couldn’t be created (${err?.message || 'unknown error'}). Try again, or use a different browser.`);
      return;
    } finally {
      setIsExporting(false);
    }
    trackEvent(layout === 'wallpaper' ? 'saved-wallpaper' : 'saved-timetable', `Saved ${layout}`);

    // Laptops download the file. Phones get the share sheet, which is how iOS saves to
    // Photos; if it can't open, the preview offers a fresh tap and a long-press instead.
    const inApp = isInAppBrowser();
    if (!isTouchDevice() && !inApp) {
      downloadImage(file);
      if (SUPPORT_URL && shouldNudge()) setShowNudge(true);
      return;
    }
    if (!inApp) {
      const result = await shareImage(file);
      if (result === 'shared' && SUPPORT_URL && shouldNudge()) setShowNudge(true);
      if (result !== 'unavailable') return;
    }
    trackEvent(inApp ? 'save-preview: in-app browser' : 'save-preview: share unavailable', 'Save preview shown');
    setSavePreview({ file, url: URL.createObjectURL(file), inApp });
  };

  const closeNudge = useCallback(() => setShowNudge(false), []);

  const closeSavePreview = () => {
    URL.revokeObjectURL(savePreview.url);
    setSavePreview(null);
  };

  // A course is on the grid once it has a class time, from the slip or added by the student.
  const scheduledCourses = visibleCourses(courses.filter((c) => c.schedules.length));
  // Overlapping classes are often alternative tutorial times; point out that they can be hidden.
  const hasClash = [...layoutLanes(scheduledCourses).values()].some((l) => l.lanes > 1);
  const unscheduledCourses = courses.filter((c) => !c.schedules.length);
  const totalCredits = courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);

  const resetData = () => {
    setCourses([]);
    setSemester('');
    setActiveCourseId(null);
    setPartialReport(null);
  };

  const hasData = courses.length > 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Khatam size={22} strokeWidth={7} color="var(--color-teal)" />
            <span className="font-kufi text-xl font-medium tracking-tight whitespace-nowrap text-ink">SlipSnap</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowWhatsNew(true)}
              className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted transition-colors hover:bg-teal-wash hover:text-ink sm:px-3"
            >
              What’s new
            </button>
            {hasData && (
              <button
                type="button"
                onClick={resetData}
                className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-teal transition-colors hover:bg-teal-wash sm:px-3"
              >
                <span className="sm:hidden">New slip</span>
                <span className="hidden sm:inline">Upload another slip</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-12 sm:px-8 lg:pb-16">
        {!hasData ? (
          <>
            <PDFUploader onDataParsed={handleDataParsed} />
            <Faq />
          </>
        ) : (
          <>
            <div className="pt-8 pb-6 lg:pt-10">
              <h1 className="font-kufi text-[2rem] leading-tight font-semibold text-ink sm:text-[2.5rem]">
                {semester || 'Your timetable'}
              </h1>
              <p className="mt-1.5 text-[0.9375rem] text-muted">
                {courses.length} courses, {totalCredits} credit hours. Select a course to change its color or hide class times.
              </p>
            </div>

            {partialReport && (
              <div role="status" className="mb-6 rounded-2xl border border-brass/40 bg-brass/5 p-4 sm:p-5">
                <p className="text-[0.9375rem] font-semibold text-ink">Some classes may be missing</p>
                <p className="mt-1 text-sm text-muted">
                  {partialReport.rows.length === 1 ? 'A row' : `${partialReport.rows.length} rows`} on your slip
                  couldn’t be read, so {partialReport.rows.length === 1 ? 'that class isn’t' : 'those classes aren’t'} on
                  the timetable yet.{' '}
                  <ReportLink fields={{ result: 'Some classes are missing.', 'slip-row': partialReport.rows.join('\n') }}>
                    Report it on GitHub
                  </ReportLink>{' '}
                  so this slip format can be supported.
                </p>
              </div>
            )}

            {unscheduledCourses.length > 0 && (
              <div role="status" className="mb-6 rounded-2xl border border-brass/40 bg-brass/5 p-4 sm:p-5">
                <p className="text-[0.9375rem] font-semibold text-ink">
                  {unscheduledCourses.length === 1
                    ? '1 course has no class time on your slip'
                    : `${unscheduledCourses.length} courses have no class time on your slip`}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Your department may not have set {unscheduledCourses.length === 1 ? 'it' : 'them'} yet. When you know
                  the times, select the course under Courses and choose Add class time.
                </p>
              </div>
            )}

            {hasClash && (
              <div role="status" className="mb-6 rounded-2xl border border-brass/40 bg-brass/5 p-4 sm:p-5">
                <p className="text-[0.9375rem] font-semibold text-ink">Some classes are at the same time</p>
                <p className="mt-1 text-sm text-muted">
                  Your slip may list tutorial times you don’t attend. Select a course under Courses and untick the
                  class times that aren’t yours to hide them.
                </p>
              </div>
            )}

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
              <section ref={previewAreaRef} aria-label="Preview" className="min-w-0">
                {layout === 'wallpaper' ? (
                  <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-8">
                    <div
                      style={{ width: wallpaperWidth * previewScale + 12, height: wallpaperHeight * previewScale + 12 }}
                      className="overflow-hidden rounded-[2.25rem] border-[6px] border-ink shadow-[0_24px_48px_-24px_rgba(13,47,46,0.45)]"
                    >
                      <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                        <WallpaperView
                          ref={wallpaperRef}
                          courses={scheduledCourses}
                          unscheduledCourses={unscheduledCourses}
                          semester={semester}
                          size={wallpaperSize}
                          theme={theme}
                          timeFormat={timeFormat}
                          classDaysOnly={classDaysOnly}
                          lockWidgets={widgetPlacement}
                          courseLabel={label}
                          activeCourseId={activeCourseId}
                          onSelectCourse={setActiveCourseId}
                          fontClass={fontFamily}
                          showSelection={!isExporting}
                        />
                      </div>
                    </div>
                    <p className="max-w-xs text-center text-[0.8125rem] text-muted">
                      Saves at {wallpaperSize.width} × {wallpaperSize.height} pixels.{' '}
                      {platform === 'android'
                        ? 'The top quarter stays clear for your lock screen clock.'
                        : 'The timetable stays clear of your lock screen clock, widgets and buttons.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-line">
                    <div
                      ref={timetableRef}
                      className={fontFamily}
                      style={{ minWidth: 720, padding: '24px 24px 20px 12px', background: colors.background }}
                    >
                      <div
                        style={{ color: colors.text, paddingLeft: 12 }}
                        className="mb-4 flex items-center gap-2 text-[0.9375rem] font-semibold"
                      >
                        <Khatam size={14} strokeWidth={7} color={colors.accent} />
                        {semester || 'Weekly timetable'}
                      </div>
                      <Timetable
                        courses={scheduledCourses}
                        activeCourseId={activeCourseId}
                        onSelectCourse={setActiveCourseId}
                        theme={theme}
                        timeFormat={timeFormat}
                        classDaysOnly={classDaysOnly}
                        courseLabel={label}
                        showSelection={!isExporting}
                      />
                      {unscheduledCourses.length > 0 && (
                        <p style={{ color: colors.mutedText, paddingLeft: 12 }} className="mt-4 text-[0.8125rem]">
                          Not on the grid:{' '}
                          {unscheduledCourses.map((c) => `${c.code} ${c.title}`.trim()).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>

              <aside className="min-w-0 lg:sticky lg:top-6">
                <ControlPanel
                  courses={courses}
                  activeCourseId={activeCourseId}
                  onSelectCourse={setActiveCourseId}
                  onColorChange={handleColorChange}
                  onShortNameChange={handleShortNameChange}
                  onToggleSlot={handleToggleSlot}
                  onAddSlots={handleAddSlots}
                  onRemoveSlot={handleRemoveSlot}
                  onExport={handleExport}
                  isExporting={isExporting}
                  exportError={exportError}
                  fontFamily={fontFamily}
                  setFontFamily={setFontFamily}
                  themeMode={mode}
                  setThemeMode={setThemeMode}
                  theme={theme}
                  setTheme={setTheme}
                  timeFormat={timeFormat}
                  setTimeFormat={setTimeFormat}
                  layout={layout}
                  setLayout={setLayout}
                  wallpaperPreset={wallpaperPreset}
                  setWallpaperPreset={setWallpaperPreset}
                  showOrientation={wallpaperSize.tablet}
                  orientation={wallpaperSize.landscape ? 'landscape' : 'portrait'}
                  setOrientation={setOrientation}
                  days={classDaysOnly ? 'class' : 'all'}
                  setDays={setDays}
                  showLockWidgets={platform !== 'android'}
                  lockWidgets={widgetPlacement}
                  setLockWidgets={setLockWidgets}
                  courseLabel={label}
                  setCourseLabel={setCourseLabel}
                />
              </aside>
            </div>

            {/* On phones the save action stays in reach below the scrolling controls. */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
              {exportError && (
                <p role="alert" className="mb-2 text-sm text-danger">
                  {exportError} <ReportLink fields={{ result: exportError }}>Report it</ReportLink>
                </p>
              )}
              <ExportButton onExport={handleExport} isExporting={isExporting} layout={layout} className="w-full" />
            </div>
          </>
        )}
      </main>

      {/* Extra bottom space on phones in the editor so the pinned save bar doesn't cover it. */}
      <footer className={`border-t border-line ${hasData ? 'pb-28 lg:pb-0' : ''}`}>
        <div className="mx-auto max-w-6xl space-y-1 px-5 py-6 text-[0.8125rem] text-muted sm:px-8">
          {GITHUB_USERNAME && (
            <p>
              Made by{' '}
              <a
                href={`https://github.com/${GITHUB_USERNAME}`}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-teal underline-offset-4 hover:underline"
              >
                @{GITHUB_USERNAME}
              </a>
            </p>
          )}
          {SUPPORT_URL && (
            <p>
              Free for every IIUM student, always. If it helped you, you can{' '}
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-teal underline-offset-4 hover:underline"
              >
                buy me a coffee
              </a>{' '}
              ☕
            </p>
          )}
          <p>
            An unofficial student project, not affiliated with IIUM. Your slip is processed on your device and never
            uploaded.
          </p>
          <p>
            Something not working? <ReportLink>Report a problem on GitHub</ReportLink>
          </p>
        </div>
      </footer>

      {showWhatsNew && <WhatsNew onClose={() => setShowWhatsNew(false)} />}

      {showNudge && <SupportNudge layout={layout} onClose={closeNudge} />}

      {savePreview && (
        <SavePreview
          file={savePreview.file}
          url={savePreview.url}
          inAppBrowser={savePreview.inApp}
          onClose={closeSavePreview}
        />
      )}
    </div>
  );
}

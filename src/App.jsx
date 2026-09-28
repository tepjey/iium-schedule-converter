import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import ControlPanel, { ExportButton } from './components/ControlPanel';
import Khatam from './components/Khatam';
import PDFUploader from './components/PDFUploader';
import Timetable from './components/Timetable';
import WallpaperView from './components/WallpaperView';
import { GITHUB_USERNAME } from './config';
import { exportToImage } from './utils/exporter';
import { DEFAULT_THEME, THEMES, getTheme, resolveWallpaperSize } from './utils/theme';

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

function useViewportWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return width;
}

export default function App() {
  const [courses, setCourses] = useState([]);
  const [semester, setSemester] = useState('');
  const [fontFamily, setFontFamily] = usePersistentState('iium.font', 'font-sans');
  const [themeMode, setThemeMode] = usePersistentState('iium.theme', 'light');
  // Remember the last theme picked in each mode, so toggling Light/Dark restores it.
  const [lightTheme, setLightTheme] = usePersistentState('iium.lightTheme', DEFAULT_THEME.light);
  const [darkTheme, setDarkTheme] = usePersistentState('iium.darkTheme', DEFAULT_THEME.dark);
  const [timeFormat, setTimeFormat] = usePersistentState('iium.timeFormat', '12h');
  const [layout, setLayout] = usePersistentState('iium.layout', 'standard');
  const [wallpaperPreset, setWallpaperPreset] = usePersistentState('iium.wallpaperPreset', 'android');
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const timetableRef = useRef(null);
  const wallpaperRef = useRef(null);
  const viewportWidth = useViewportWidth();

  const mode = themeMode === 'dark' ? 'dark' : 'light';
  const pickedTheme = mode === 'dark' ? darkTheme : lightTheme;
  const theme = THEMES[pickedTheme]?.mode === mode ? pickedTheme : DEFAULT_THEME[mode];
  const setTheme = mode === 'dark' ? setDarkTheme : setLightTheme;
  const colors = getTheme(theme);
  const wallpaperSize = resolveWallpaperSize(wallpaperPreset);

  // Shrink the phone preview to fit narrow screens; the export itself is unaffected.
  const wallpaperWidth = wallpaperSize.width / wallpaperSize.pixelRatio;
  const wallpaperHeight = wallpaperSize.height / wallpaperSize.pixelRatio;
  const previewScale = Math.min(1, (viewportWidth - 56) / wallpaperWidth);

  const handleDataParsed = ({ courses: parsedCourses, semester: parsedSemester }) => {
    setCourses(parsedCourses);
    setSemester(parsedSemester);
    setActiveCourseId(null);
  };

  const handleColorChange = (newColor) => {
    if (!activeCourseId) return;
    setCourses((prev) => prev.map((c) => (c.id === activeCourseId ? { ...c, color: newColor } : c)));
  };

  const handleExport = async () => {
    // Commit the render that hides the selection outline before capturing,
    // so the exported image never shows which course was selected.
    flushSync(() => {
      setIsExporting(true);
      setExportError('');
    });
    try {
      if (layout === 'wallpaper') {
        await exportToImage(wallpaperRef, {
          filename: `IIUM_Wallpaper_${wallpaperSize.width}x${wallpaperSize.height}.png`,
          pixelRatio: wallpaperSize.pixelRatio,
        });
      } else {
        await exportToImage(timetableRef, {
          filename: 'IIUM_Timetable.png',
          pixelRatio: 3,
          backgroundColor: colors.background,
        });
      }
    } catch (err) {
      console.error('Export failed:', err);
      setExportError('The image couldn’t be saved. Try again, or use a different browser.');
    } finally {
      setIsExporting(false);
    }
  };

  const scheduledCourses = courses.filter((c) => !c.isUnscheduled);
  const unscheduledCourses = courses.filter((c) => c.isUnscheduled);
  const totalCredits = courses.reduce((sum, c) => sum + (c.creditHours || 0), 0);

  const resetData = () => {
    setCourses([]);
    setSemester('');
    setActiveCourseId(null);
  };

  const hasData = courses.length > 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Khatam size={22} strokeWidth={7} color="var(--color-teal)" />
            <span className="font-kufi text-xl font-medium tracking-tight text-ink">IIUM Timetable</span>
          </div>
          {hasData && (
            <button
              type="button"
              onClick={resetData}
              className="rounded-lg px-3 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal-wash"
            >
              Upload another slip
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-12 sm:px-8 lg:pb-16">
        {!hasData ? (
          <PDFUploader onDataParsed={handleDataParsed} />
        ) : (
          <>
            <div className="pt-8 pb-6 lg:pt-10">
              <h1 className="font-kufi text-[2rem] leading-tight font-semibold text-ink sm:text-[2.5rem]">
                {semester || 'Your timetable'}
              </h1>
              <p className="mt-1.5 text-[0.9375rem] text-muted">
                {courses.length} courses, {totalCredits} credit hours. Select a course to change its color.
              </p>
            </div>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
              <section aria-label="Preview" className="min-w-0">
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
                          activeCourseId={activeCourseId}
                          onSelectCourse={setActiveCourseId}
                          fontClass={fontFamily}
                          showSelection={!isExporting}
                        />
                      </div>
                    </div>
                    <p className="max-w-xs text-center text-[0.8125rem] text-muted">
                      Saves at {wallpaperSize.width} × {wallpaperSize.height} pixels. The top quarter stays clear for
                      your lock screen clock.
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

              <aside className="lg:sticky lg:top-6">
                <ControlPanel
                  courses={courses}
                  activeCourseId={activeCourseId}
                  onSelectCourse={setActiveCourseId}
                  onColorChange={handleColorChange}
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
                />
              </aside>
            </div>

            {/* On phones the save action stays in reach below the scrolling controls. */}
            <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
              {exportError && (
                <p role="alert" className="mb-2 text-sm text-danger">
                  {exportError}
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
          <p>
            An unofficial student project, not affiliated with IIUM. Your slip is processed on your device and never
            uploaded.
          </p>
        </div>
      </footer>
    </div>
  );
}

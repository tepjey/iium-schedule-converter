import { forwardRef } from 'react';
import { DAY_LABELS, formatHour, formatTime, visibleDays } from '../utils/parser';
import { blockColors, getTheme } from '../utils/theme';
import Khatam from './Khatam';

// Share of the screen kept clear at the top for the lock screen clock and date,
// and at the bottom for the home indicator / notification shortcuts.
const TOP_CLEARANCE = 0.25;
const BOTTOM_CLEARANCE = 0.06;
const TIME_COLUMN = 30;
const HEADER_HEIGHT = 24;
const FOOTER_HEIGHT = 40;

// A phone-sized timetable rendered at the wallpaper's CSS size (e.g. 360×800 for a
// 1080×2400 export at 3x), so what you see in the preview is what gets exported.
const WallpaperView = forwardRef(function WallpaperView(
  {
    courses,
    unscheduledCourses = [],
    semester = '',
    size,
    theme = 'midnight',
    timeFormat = '12h',
    activeCourseId,
    onSelectCourse,
    fontClass,
    showSelection = true,
  },
  ref
) {
  const colors = getTheme(theme);
  const width = size.width / size.pixelRatio;
  const height = size.height / size.pixelRatio;

  const allSchedules = courses.flatMap((c) => c.schedules || []);
  const days = visibleDays(allSchedules);

  // Compact: only span the hours that actually have classes.
  const firstHour = allSchedules.length ? Math.min(...allSchedules.map((s) => Math.floor(s.start / 60))) : 8;
  const lastHour = allSchedules.length ? Math.max(...allSchedules.map((s) => Math.ceil(s.end / 60))) : 17;
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => i + firstHour);

  const sidePadding = Math.round(width * 0.045);
  const gridTop = Math.round(height * TOP_CLEARANCE);
  const gridHeight = height - gridTop - Math.round(height * BOTTOM_CLEARANCE) - FOOTER_HEIGHT - HEADER_HEIGHT;
  const pxPerMinute = gridHeight / (hours.length * 60);
  const columnWidth = (width - sidePadding * 2 - TIME_COLUMN) / days.length;

  return (
    <div
      ref={ref}
      className={fontClass}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: colors.wallpaperBackground,
        color: colors.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: gridTop,
          left: sidePadding,
          right: sidePadding,
          height: HEADER_HEIGHT + gridHeight,
          borderRadius: 14,
          overflow: 'hidden',
          background: colors.background,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: 'flex', height: HEADER_HEIGHT, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ width: TIME_COLUMN }} />
          {days.map((day) => (
            <div
              key={day}
              style={{
                width: columnWidth,
                paddingLeft: 5,
                fontSize: 9.5,
                fontWeight: 650,
                lineHeight: `${HEADER_HEIGHT}px`,
              }}
            >
              {DAY_LABELS[day]}
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', height: gridHeight }}>
          {hours.map((hour, i) => (
            <div
              key={hour}
              style={{
                position: 'absolute',
                top: i * 60 * pxPerMinute,
                left: 0,
                right: 0,
                height: 60 * pxPerMinute,
                borderTop: i === 0 ? 'none' : `1px solid ${colors.gridLine}`,
              }}
            >
              <div
                style={{
                  width: TIME_COLUMN,
                  fontSize: 6.5,
                  fontWeight: 500,
                  color: colors.mutedText,
                  textAlign: 'center',
                  paddingTop: 3,
                }}
              >
                {formatHour(hour, timeFormat)}
              </div>
            </div>
          ))}

          {days.map((day, colIdx) => (
            <div
              key={`col-${day}`}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: TIME_COLUMN + colIdx * columnWidth,
                borderLeft: `1px solid ${colors.gridLine}`,
              }}
            />
          ))}

          {courses.flatMap((course) =>
            (course.schedules || []).map((schedule) => {
              const colIdx = days.indexOf(schedule.day);
              if (colIdx === -1) return null;
              const top = (schedule.start - firstHour * 60) * pxPerMinute;
              const blockHeight = (schedule.end - schedule.start) * pxPerMinute;
              const isActive = showSelection && activeCourseId === course.id;
              const block = blockColors(course.color, colors);

              return (
                <button
                  key={`${course.id}-${schedule.day}-${schedule.start}`}
                  type="button"
                  onClick={() => onSelectCourse?.(course.id)}
                  aria-label={`${course.code} ${course.title}`}
                  style={{
                    position: 'absolute',
                    top: top + 1.5,
                    height: blockHeight - 3,
                    left: TIME_COLUMN + colIdx * columnWidth + 2,
                    width: columnWidth - 4,
                    // Buttons center their content by default; pin it to the top.
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    border: 'none',
                    borderLeft: `2px solid ${block.edge}`,
                    borderRadius: 4,
                    padding: '4px 4px 4px 5px',
                    background: block.fill,
                    color: block.text,
                    textAlign: 'left',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    outline: isActive ? `1px solid ${colors.activeRing}` : 'none',
                    outlineOffset: 1,
                    lineHeight: 1.25,
                    font: 'inherit',
                  }}
                >
                  <div style={{ fontSize: 8, fontWeight: 700 }}>{course.code}</div>
                  <div style={{ fontSize: 6.5, opacity: 0.85 }}>{formatTime(schedule.start, timeFormat)}</div>
                  {schedule.venue && <div style={{ fontSize: 6.5, opacity: 0.85 }}>{schedule.venue}</div>}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: sidePadding,
          right: sidePadding,
          top: gridTop + HEADER_HEIGHT + gridHeight + 10,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 7,
          fontSize: 7.5,
          lineHeight: 1.45,
          color: colors.mutedText,
        }}
      >
        <Khatam size={11} strokeWidth={7} color={colors.accent} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          {semester && <div style={{ fontWeight: 600, color: colors.text }}>{semester}</div>}
          {unscheduledCourses.length > 0 && (
            <div>
              Not on the grid: {unscheduledCourses.map((c) => `${c.code}${c.title ? ` ${c.title}` : ''}`).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default WallpaperView;

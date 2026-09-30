import { forwardRef } from 'react';
import { DAY_LABELS, courseLabels, formatHour, formatTime, visibleDays } from '../utils/parser';
import { blockColors, getTheme, lockScreenInsets } from '../utils/theme';
import Khatam from './Khatam';

const TIME_COLUMN = 30;
const HEADER_HEIGHT = 24;
const FOOTER_GAP = 8;
// Block text: an 8px code line, then 6.5px lines for the time and venue.
const CODE_LINE = 10;
const META_LINE = 7.5;
const BLOCK_PADDING = 3;
const BLOCK_INSET = 2;
const BLOCK_EDGE = 2;

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
    classDaysOnly = false,
    courseLabel = 'code',
    lockWidgets = 'top',
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
  // Lines and block edges land on whole device pixels, so every grid line is equally crisp.
  const snap = (v) => Math.round(v * size.pixelRatio) / size.pixelRatio;

  const allSchedules = courses.flatMap((c) => c.schedules || []);
  const days = visibleDays(allSchedules, classDaysOnly);

  // Compact: only span the hours that actually have classes.
  const firstHour = allSchedules.length ? Math.min(...allSchedules.map((s) => Math.floor(s.start / 60))) : 8;
  const lastHour = allSchedules.length ? Math.max(...allSchedules.map((s) => Math.ceil(s.end / 60))) : 17;
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => i + firstHour);

  // Keep the whole card inside the part of the screen the lock screen leaves visible.
  const insets = lockScreenInsets(size, lockWidgets);
  const hasFooter = Boolean(semester || unscheduledCourses.length);
  const footerHeight = hasFooter ? (semester ? 11 : 0) + (unscheduledCourses.length ? 22 : 0) : 0;
  const sidePadding = Math.round(width * 0.045);
  const cardLeft = sidePadding + Math.round(width * insets.left);
  const cardWidth = width - cardLeft - sidePadding;
  const cardTop = Math.round(height * insets.top);
  const cardBottom = height - Math.round(height * insets.bottom) - (hasFooter ? footerHeight + FOOTER_GAP : 0);
  const gridHeight = cardBottom - cardTop - HEADER_HEIGHT - 2; // 2: the card's border
  const pxPerMinute = gridHeight / (hours.length * 60);
  const columnWidth = (cardWidth - 2 - TIME_COLUMN) / days.length;

  const yFor = (minutes) => snap((minutes - firstHour * 60) * pxPerMinute);
  const xFor = (colIdx) => snap(TIME_COLUMN + colIdx * columnWidth);
  // Day names start where the text in the class blocks starts.
  const textIndent = BLOCK_INSET + BLOCK_EDGE + BLOCK_PADDING;

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
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          height: cardBottom - cardTop,
          borderRadius: 14,
          overflow: 'hidden',
          background: colors.background,
          border: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            position: 'relative',
            height: HEADER_HEIGHT,
            background: colors.headerBackground,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {days.map((day, colIdx) => (
            <div
              key={day}
              style={{
                position: 'absolute',
                left: xFor(colIdx) + textIndent,
                width: xFor(colIdx + 1) - xFor(colIdx) - textIndent,
                fontSize: 9.5,
                fontWeight: 650,
                lineHeight: `${HEADER_HEIGHT - 1}px`,
                whiteSpace: 'nowrap',
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
                top: yFor(hour * 60),
                left: 0,
                right: 0,
                height: yFor((hour + 1) * 60) - yFor(hour * 60),
                borderTop: i === 0 ? 'none' : `1px solid ${colors.gridLine}`,
              }}
            >
              <div
                style={{
                  width: TIME_COLUMN,
                  fontSize: 6.5,
                  fontWeight: 500,
                  lineHeight: 1,
                  color: colors.mutedText,
                  textAlign: 'center',
                  paddingTop: 3,
                  whiteSpace: 'nowrap',
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
                left: xFor(colIdx),
                borderLeft: `1px solid ${colors.gridLine}`,
              }}
            />
          ))}

          {courses.flatMap((course) =>
            (course.schedules || []).map((schedule) => {
              const colIdx = days.indexOf(schedule.day);
              if (colIdx === -1) return null;
              const top = yFor(schedule.start) + 1.5;
              const blockHeight = yFor(schedule.end) - yFor(schedule.start) - 3;
              const isActive = showSelection && activeCourseId === course.id;
              const block = blockColors(course.color, colors);

              // Show only the lines that fit whole, so short blocks never end in cut-off text.
              // Lines are added in order of importance: label, code (with 'both'), time, venue.
              const { primary, secondary } = courseLabels(course, courseLabel);
              let room = blockHeight - BLOCK_PADDING * 2 - CODE_LINE;
              const showSecondary = Boolean(secondary) && room >= META_LINE;
              if (showSecondary) room -= META_LINE;
              const showTime = room >= META_LINE;
              if (showTime) room -= META_LINE;
              const venueLines = schedule.venue ? Math.max(0, Math.floor(room / META_LINE)) : 0;

              return (
                <button
                  key={`${course.id}-${schedule.day}-${schedule.start}`}
                  type="button"
                  onClick={() => onSelectCourse?.(course.id)}
                  aria-label={`${course.code} ${course.title}`}
                  style={{
                    position: 'absolute',
                    top,
                    height: blockHeight,
                    left: xFor(colIdx) + BLOCK_INSET,
                    width: xFor(colIdx + 1) - xFor(colIdx) - BLOCK_INSET * 2,
                    // Buttons center their content by default; pin it to the top.
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    border: 'none',
                    borderLeft: `${BLOCK_EDGE}px solid ${block.edge}`,
                    borderRadius: 4,
                    padding: BLOCK_PADDING,
                    background: block.fill,
                    color: block.text,
                    textAlign: 'left',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    outline: isActive ? `1px solid ${colors.activeRing}` : 'none',
                    outlineOffset: 1,
                    font: 'inherit',
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      lineHeight: `${CODE_LINE}px`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {primary}
                  </div>
                  {showSecondary && (
                    <div style={{ fontSize: 6.5, fontWeight: 600, lineHeight: `${META_LINE}px`, whiteSpace: 'nowrap' }}>
                      {secondary}
                    </div>
                  )}
                  {showTime && (
                    <div style={{ fontSize: 6.5, lineHeight: `${META_LINE}px`, opacity: 0.85, whiteSpace: 'nowrap' }}>
                      {formatTime(schedule.start, timeFormat)}
                    </div>
                  )}
                  {venueLines > 0 && (
                    <div
                      style={{
                        fontSize: 6.5,
                        lineHeight: `${META_LINE}px`,
                        opacity: 0.85,
                        display: '-webkit-box',
                        WebkitBoxOrient: 'vertical',
                        WebkitLineClamp: venueLines,
                        overflow: 'hidden',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {schedule.venue}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {hasFooter && (
        <div
          style={{
            position: 'absolute',
            left: cardLeft,
            width: cardWidth,
            top: cardBottom + FOOTER_GAP,
            height: footerHeight,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            fontSize: 7.5,
            lineHeight: '11px',
            color: colors.mutedText,
            overflow: 'hidden',
          }}
        >
          <Khatam size={10} strokeWidth={7} color={colors.accent} style={{ flexShrink: 0, marginTop: 0.5 }} />
          <div style={{ minWidth: 0 }}>
            {semester && <div style={{ fontWeight: 600, color: colors.text, whiteSpace: 'nowrap' }}>{semester}</div>}
            {unscheduledCourses.length > 0 && (
              <div
                style={{
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                  overflow: 'hidden',
                }}
              >
                Not on the grid: {unscheduledCourses.map((c) => `${c.code}${c.title ? ` ${c.title}` : ''}`).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default WallpaperView;

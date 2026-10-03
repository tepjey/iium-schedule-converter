import { forwardRef, useEffect } from 'react';
import { DAY_LABELS, courseLabels, formatHour, formatTime, layoutLanes, slotKey, visibleDays } from '../utils/parser';
import { DEFAULT_STYLE, FONTS, SHADOWS, TEXT_SCALE, blockBorders, blockLook, cardFill, loadFont } from '../studio/styleModel';
import { DecorLayer } from '../studio/Decor';
import { getTheme, lockScreenInsets } from '../utils/theme';
import Khatam from './Khatam';

// Sizes at text size M; a theme's text size (2.0) scales them.
const BASE = { timeColumn: 30, header: 24, codeLine: 10, metaLine: 7.5 };
const FOOTER_GAP = 8;
const BLOCK_PADDING = 3;
const BLOCK_INSET = 2;

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
  // How the card, blocks, text and grid are drawn. Built-in themes have no style and
  // use the defaults, which are the original look.
  const style = colors.style || DEFAULT_STYLE;
  const decor = colors.decor || [];
  const scale = TEXT_SCALE[style.textSize] || 1;
  const TIME_COLUMN = Math.round(BASE.timeColumn * scale);
  const HEADER_HEIGHT = Math.round(BASE.header * scale);
  const CODE_LINE = BASE.codeLine * scale;
  const META_LINE = BASE.metaLine * scale;
  const BLOCK_EDGE = style.blockEdge ? 2 : 0;
  const cardBorder = style.cardBorder ? 1 : 0;
  const fontFamily = FONTS[style.font]?.family;
  useEffect(() => {
    loadFont(style.font);
  }, [style.font]);
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
  const footerLine = Math.round(11 * scale);
  const footerPad = style.footerCard ? 5 : 0;
  const footerHeight = hasFooter
    ? (semester ? footerLine : 0) + (unscheduledCourses.length ? footerLine * 2 : 0) + footerPad * 2
    : 0;
  const sidePadding = Math.round(width * 0.045);
  const cardLeft = sidePadding + Math.round(width * insets.left);
  const cardWidth = width - cardLeft - sidePadding;
  const cardTop = Math.round(height * insets.top);
  const cardBottom = height - Math.round(height * insets.bottom) - (hasFooter ? footerHeight + FOOTER_GAP : 0);
  const gridHeight = cardBottom - cardTop - HEADER_HEIGHT - cardBorder * 2;
  const pxPerMinute = gridHeight / (hours.length * 60);
  const columnWidth = (cardWidth - cardBorder * 2 - TIME_COLUMN) / days.length;

  // A see-through card over a photo shows a much blurrier copy of the photo behind it,
  // lined up exactly with the wallpaper's photo (which is drawn "cover", centered).
  let cardBackground = cardFill(colors, style);
  if (style.cardOpacity < 100 && style.cardFrost && colors.photo?.frostUrl) {
    const { width: pw, height: ph, frostUrl } = colors.photo;
    const cover = Math.max(width / pw, height / ph);
    const bw = pw * cover;
    const bh = ph * cover;
    const x = (width - bw) / 2 - cardLeft - cardBorder;
    const y = (height - bh) / 2 - cardTop - cardBorder;
    cardBackground = `linear-gradient(${cardBackground}, ${cardBackground}), url("${frostUrl}") ${x}px ${y}px / ${bw}px ${bh}px no-repeat`;
  }

  const lanes = layoutLanes(courses);
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
        ...(fontFamily && { fontFamily }),
      }}
    >
      {/* Stickers and notes (2.0): those set behind the timetable are drawn first. */}
      {decor.length > 0 && <DecorLayer items={decor} layer="back" theme={colors} width={width} height={height} />}

      <div
        style={{
          position: 'absolute',
          top: cardTop,
          left: cardLeft,
          width: cardWidth,
          height: cardBottom - cardTop,
          borderRadius: style.cardRadius,
          overflow: 'hidden',
          background: cardBackground,
          border: cardBorder ? `1px solid ${colors.border}` : 'none',
          boxShadow: SHADOWS[style.cardShadow],
        }}
      >
        <div
          style={{
            position: 'relative',
            height: HEADER_HEIGHT,
            // See-through like the card when the card is.
            background: style.header === 'filled' ? cardFill({ background: colors.headerBackground }, style) : 'transparent',
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
                fontSize: 9.5 * scale,
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
                borderTop: i === 0 || !style.hourLines ? 'none' : `1px solid ${colors.gridLine}`,
              }}
            >
              <div
                style={{
                  width: TIME_COLUMN,
                  fontSize: 6.5 * scale,
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

          {style.dayLines && days.map((day, colIdx) => (
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
              const block = blockLook(course.color, colors, style);
              // Overlapping classes split the day's column between them.
              const { lane, lanes: laneCount } = lanes.get(slotKey(course, schedule)) || { lane: 0, lanes: 1 };
              const laneWidth = (xFor(colIdx + 1) - xFor(colIdx)) / laneCount;
              const left = snap(xFor(colIdx) + lane * laneWidth) + BLOCK_INSET;
              const right = snap(xFor(colIdx) + (lane + 1) * laneWidth) - (lane === laneCount - 1 ? BLOCK_INSET : 1);

              // Show only the lines that fit whole, so short blocks never end in cut-off text.
              // Lines are kept in order of importance: label, code (with 'both'), venue, then
              // start time, which the grid already shows by the block's position.
              const { primary, secondary } = courseLabels(course, courseLabel);
              let room = blockHeight - BLOCK_PADDING * 2 - CODE_LINE;
              const showSecondary = Boolean(secondary) && room >= META_LINE;
              if (showSecondary) room -= META_LINE;
              let venueLines = schedule.venue && room >= META_LINE ? 1 : 0;
              room -= venueLines * META_LINE;
              const showTime = room >= META_LINE;
              if (showTime) room -= META_LINE;
              // A long venue may take a second line when there's still room.
              if (venueLines && room >= META_LINE) venueLines = 2;

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
                    left,
                    width: right - left,
                    // Buttons center their content by default; pin it to the top.
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    ...blockBorders(block, BLOCK_EDGE),
                    borderRadius: style.blockRadius,
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
                      fontSize: 8 * scale,
                      fontWeight: style.titleWeight === 'bold' ? 700 : 560,
                      lineHeight: `${CODE_LINE}px`,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {primary}
                  </div>
                  {showSecondary && (
                    <div style={{ fontSize: 6.5 * scale, fontWeight: 600, lineHeight: `${META_LINE}px`, whiteSpace: 'nowrap' }}>
                      {secondary}
                    </div>
                  )}
                  {showTime && (
                    <div style={{ fontSize: 6.5 * scale, lineHeight: `${META_LINE}px`, opacity: 0.85, whiteSpace: 'nowrap' }}>
                      {formatTime(schedule.start, timeFormat)}
                    </div>
                  )}
                  {venueLines > 0 && (
                    <div
                      style={{
                        fontSize: 6.5 * scale,
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
            fontSize: 7.5 * scale,
            lineHeight: `${footerLine}px`,
            color: colors.mutedText,
            overflow: 'hidden',
            ...(style.footerCard && {
              width: 'auto',
              maxWidth: cardWidth,
              padding: `${footerPad}px 8px`,
              borderRadius: Math.min(style.cardRadius, 10),
              background: cardFill(colors, { ...style, cardOpacity: Math.max(style.cardOpacity, 85) }),
            }),
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

      {decor.length > 0 && <DecorLayer items={decor} layer="front" theme={colors} width={width} height={height} />}
    </div>
  );
});

export default WallpaperView;

import { calculateGridPosition, DAY_LABELS, formatHour, layoutLanes, slotKey, visibleDays } from '../utils/parser';
import { blockColors, getTheme } from '../utils/theme';
import SubjectCard from './SubjectCard';

const ROWS_PER_HOUR = 6;
const ROW_HEIGHT = 12;
const TIME_COLUMN = 56;
const HEADER_HEIGHT = 40;

export default function Timetable({
  courses,
  activeCourseId,
  onSelectCourse,
  theme = 'classic',
  timeFormat = '12h',
  showSelection = true,
  classDaysOnly = false,
  courseLabel = 'code',
}) {
  const colors = getTheme(theme);
  const allSchedules = courses.flatMap((c) => c.schedules || []);
  const days = visibleDays(allSchedules, classDaysOnly);

  // Fit the grid to the classes, but never narrower than 8am-6pm.
  const firstHour = Math.min(8, ...allSchedules.map((s) => Math.floor(s.start / 60)));
  const lastHour = Math.max(18, ...allSchedules.map((s) => Math.ceil(s.end / 60)));
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => i + firstHour);
  const totalRows = hours.length * ROWS_PER_HOUR;
  const lanes = layoutLanes(courses);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${TIME_COLUMN}px repeat(${days.length}, minmax(112px, 1fr))`,
        gridTemplateRows: `${HEADER_HEIGHT}px repeat(${totalRows}, ${ROW_HEIGHT}px)`,
        width: '100%',
        color: colors.text,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {days.map((day, i) => (
        <div
          key={day}
          style={{
            gridColumn: i + 2,
            gridRow: 1,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 10px 10px',
            fontSize: 14,
            fontWeight: 650,
            letterSpacing: '-0.005em',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {DAY_LABELS[day]}
        </div>
      ))}

      {/* Hour labels sit on the line they name rather than inside the row. */}
      {hours.map((hour, i) => (
        <div
          key={hour}
          style={{
            gridColumn: 1,
            gridRow: `${i * ROWS_PER_HOUR + 2} / span ${ROWS_PER_HOUR}`,
            fontSize: 11.5,
            fontWeight: 500,
            color: colors.mutedText,
            paddingRight: 12,
            textAlign: 'right',
            transform: i === 0 ? 'translateY(4px)' : 'translateY(-8px)',
          }}
        >
          {formatHour(hour, timeFormat)}
        </div>
      ))}

      <div
        style={{
          gridColumn: '2 / -1',
          gridRow: '2 / -1',
          display: 'grid',
          gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${totalRows}, ${ROW_HEIGHT}px)`,
          position: 'relative',
        }}
      >
        {hours.map((hour, i) => (
          <div
            key={`separator-${hour}`}
            style={{
              gridColumn: '1 / -1',
              gridRow: `${i * ROWS_PER_HOUR + 1} / span ${ROWS_PER_HOUR}`,
              borderBottom: `1px solid ${colors.gridLine}`,
            }}
          />
        ))}

        {days.map((day, colIdx) => (
          <div
            key={`column-${day}`}
            style={{
              gridColumn: colIdx + 1,
              gridRow: '1 / -1',
              borderLeft: `1px solid ${colors.gridLine}`,
            }}
          />
        ))}

        {courses.flatMap((course) =>
          (course.schedules || []).map((schedule) => {
            const dayIndex = days.indexOf(schedule.day);
            if (dayIndex === -1) return null;

            const { startRow, span } = calculateGridPosition(schedule, firstHour);
            const isActive = showSelection && activeCourseId === course.id;
            const block = blockColors(course.color, colors);
            // Overlapping classes split the day's column between them.
            const { lane, lanes: laneCount } = lanes.get(slotKey(course, schedule)) || { lane: 0, lanes: 1 };

            return (
              <button
                key={`${course.id}-${schedule.day}-${schedule.start}`}
                type="button"
                onClick={() => onSelectCourse?.(course.id)}
                aria-pressed={isActive}
                aria-label={`${course.code} ${course.title}`}
                style={{
                  gridColumn: dayIndex + 1,
                  gridRow: `${startRow} / span ${span}`,
                  margin: 2,
                  marginLeft: `calc(${(lane * 100) / laneCount}% + 2px)`,
                  width: `calc(${100 / laneCount}% - 4px)`,
                  justifySelf: 'start',
                  // Buttons center their content by default; pin it to the top.
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  minWidth: 0,
                  border: 'none',
                  borderLeft: `3px solid ${block.edge}`,
                  borderRadius: 6,
                  background: block.fill,
                  color: block.text,
                  textAlign: 'left',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  outline: isActive ? `1.5px solid ${colors.activeRing}` : 'none',
                  outlineOffset: 1,
                  overflow: 'hidden',
                  zIndex: 1,
                  font: 'inherit',
                }}
              >
                <SubjectCard course={course} schedule={schedule} timeFormat={timeFormat} courseLabel={courseLabel} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

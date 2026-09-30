import { courseLabels, formatRange } from '../utils/parser';

const oneLine = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

// Rendered inside the Timetable's clickable block, so it must not be a <button> itself.
// Code, title and venue each keep to one line so a block never spills into clipped text;
// only the time may wrap, since cutting it off would hide when the class ends.
export default function SubjectCard({ course, schedule, timeFormat = '12h', courseLabel = 'code' }) {
  const { primary, secondary } = courseLabels(course, courseLabel);
  return (
    <div style={{ fontSize: 11.5, lineHeight: 1.35, minWidth: 0, width: '100%' }}>
      {/* The code shares the label's line, so 'both' adds no line that could push the venue out. */}
      <div style={{ ...oneLine, fontWeight: 700, fontSize: 12.5, letterSpacing: '-0.005em' }}>
        {primary}
        {secondary && <span style={{ fontWeight: 600, fontSize: 11, opacity: 0.8, marginLeft: 6 }}>{secondary}</span>}
      </div>
      {course?.title && <div style={{ ...oneLine, fontWeight: 500 }}>{course.title}</div>}
      {schedule && (
        <div style={{ opacity: 0.8, marginTop: 2 }}>{formatRange(schedule.start, schedule.end, timeFormat)}</div>
      )}
      {schedule?.venue && <div style={{ ...oneLine, opacity: 0.8 }}>{schedule.venue}</div>}
    </div>
  );
}

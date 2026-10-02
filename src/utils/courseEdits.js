import { DAY_ORDER } from './parser';

// A student's changes to their courses (color, short name, hidden class times and class
// times they added themselves), saved in this browser by course code so uploading the
// same slip again brings them back.

const EDITS_KEY = 'iium.courseEdits';

// Identifies a class time within a course, e.g. "MON 900-960".
export const slotId = (schedule) => `${schedule.day} ${schedule.start}-${schedule.end}`;

const loadEdits = () => {
  try {
    return JSON.parse(localStorage.getItem(EDITS_KEY)) || {};
  } catch {
    return {};
  }
};

export const applySavedEdits = (courses) => {
  const edits = loadEdits();
  return courses.map((course) => {
    const saved = edits[course.code];
    if (!saved) return course;
    const hidden = new Set(saved.hidden || []);
    // Added times that the slip itself now lists are dropped as duplicates.
    const onSlip = new Set(course.schedules.map(slotId));
    const added = (saved.added || [])
      .filter((s) => s && DAY_ORDER.includes(s.day) && Number.isFinite(s.start) && Number.isFinite(s.end) && s.end > s.start)
      .filter((s) => !onSlip.has(slotId(s)))
      .map((s) => ({ day: s.day, start: s.start, end: s.end, venue: s.venue || '', added: true }));
    return {
      ...course,
      color: saved.color || course.color,
      shortName: typeof saved.shortName === 'string' ? saved.shortName : course.shortName,
      schedules: [...course.schedules, ...added].map((s) => ({ ...s, hidden: hidden.has(slotId(s)) })),
      // Times were added because the slip had none, and now it has some: worth a mention.
      slipTimesArrived: Boolean(saved.added?.length && saved.addedWithoutSlipTimes && onSlip.size),
    };
  });
};

export const saveEdits = (courses) => {
  const edits = loadEdits();
  for (const course of courses) {
    const slipTimes = course.schedules.filter((s) => !s.added);
    edits[course.code] = {
      color: course.color,
      shortName: course.shortName,
      hidden: course.schedules.filter((s) => s.hidden).map(slotId),
      added: course.schedules
        .filter((s) => s.added)
        .map(({ day, start, end, venue }) => ({ day, start, end, venue })),
      // Stays set once times arrive on the slip, so the note shows until the added ones go.
      addedWithoutSlipTimes: Boolean(course.slipTimesArrived) || slipTimes.length === 0,
    };
  }
  try {
    localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
  } catch {
    // Storage unavailable (private mode etc.); edits just won't be remembered.
  }
};

// The courses as drawn: hidden class times left out, and courses with every class
// time hidden left off the grid entirely.
export const visibleCourses = (courses) =>
  courses
    .map((course) => ({ ...course, schedules: course.schedules.filter((s) => !s.hidden) }))
    .filter((course) => course.schedules.length);

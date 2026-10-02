// Vite does not resolve bare package paths inside `new URL(..., import.meta.url)`,
// so the worker must be imported as an asset URL instead.
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { COURSE_PALETTE } from './theme';

// pdf.js is most of the app's code, so it loads only once a slip is chosen.
// The legacy build is transpiled for older browsers such as iOS Safari.
const loadPdfjs = async () => {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  return pdfjsLib;
};

export const DAY_ORDER = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT', 'SUN'];

export const DAY_LABELS = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THUR: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
};

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THUR', 'FRI'];

// Timetable columns: Mon-Fri, plus weekend days only when a class falls on them.
// With `classDaysOnly`, weekdays without a class (often Friday) are left out too.
export const visibleDays = (schedules, classDaysOnly = false) => {
  const usedDays = new Set(schedules.map((s) => s.day));
  const days = DAY_ORDER.filter((d) => usedDays.has(d) || (!classDaysOnly && WEEKDAYS.includes(d)));
  return days.length ? days : WEEKDAYS;
};

// Abbreviations IIUM uses in the "Day" column, e.g. M-W, T-TH, WED, THUR.
const DAY_ALIASES = {
  M: 'MON', MON: 'MON',
  T: 'TUE', TUE: 'TUE', TUES: 'TUE',
  W: 'WED', WED: 'WED',
  TH: 'THUR', THU: 'THUR', THUR: 'THUR', THURS: 'THUR',
  F: 'FRI', FRI: 'FRI',
  SAT: 'SAT', SUN: 'SUN',
};

const DAY_TOKEN = '(?:THURS|THUR|THU|TUES|TUE|MON|WED|FRI|SAT|SUN|TH|M|T|W|F)';
const DAYS = `${DAY_TOKEN}(?:-${DAY_TOKEN})*`;
// Minutes are optional: slips print whole hours as "2.00 - 5" or "9.00 - 12".
const TIME = '(\\d{1,2}(?:[.:]\\d{2})?)\\s*-\\s*(\\d{1,2}(?:[.:]\\d{2})?)\\s*(AM|PM)?';

// "BICS 2301 3 R Enterprise Networks 3 T-TH 11.30 - 12.50 PM ICT CISCO LAB LEVEL 4C"
const COURSE_ROW = /^([A-Z]{3,4})\s*(\d{4}[A-Z]?)\s+(\d{1,3})\s+([A-Z]{1,2})\s+(.*)$/;
// Remainder after status: "<title> <chr> [<days> <time> <period> <venue>]"
// Credit hours can be fractional, printed as ".5" or "0.5" (e.g. CCFM 2061, LQAD 2003).
const CREDITS = '(\\d{1,2}(?:\\.\\d+)?|\\.\\d+)';
const COURSE_REST = new RegExp(`^(.*?)\\s+${CREDITS}(?:\\s+(${DAYS})\\s+${TIME}\\s*(.*))?$`);
// Continuation line for a course with extra slots: "MON 2.00 - 3.30 PM [venue]"
const EXTRA_SLOT = new RegExp(`^(${DAYS})\\s+${TIME}\\s*(.*)$`);
// A long title wraps onto the next line, sharing it with that line's slot:
// "SCHOOLS WED 2.00 - 3.20 PM EDU LR 15". The title part has no digits.
const WRAPPED_SLOT = new RegExp(`^([^\\d]+?)\\s+(${DAYS})\\s+${TIME}\\s*(.*)$`);

const defaultColors = COURSE_PALETTE.map((c) => c.hex);

// "Session : 2026/2027 Semester : 1"
const SESSION = /Session\s*:\s*(\d{4}\s*\/\s*\d{4})\s+Semester\s*:\s*(\d)/i;

export const parseConfirmationSlip = async (file) => {
  const [pdfjsLib, arrayBuffer] = await Promise.all([loadPdfjs(), file.arrayBuffer()]);
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    lines.push(...groupIntoLines(await readTextItems(page)));
  }

  const session = lines.join(' ').match(SESSION);
  const { courses, unreadable } = processLines(lines);
  return {
    courses,
    semester: session ? `Semester ${session[2]}, ${session[1].replace(/\s/g, '')}` : '',
    diagnostics: {
      lineCount: lines.length,
      // Timetable rows the parser couldn't make sense of. If no courses were found at
      // all, fall back to any line that looks like a course, to show what the table
      // looked like. Long numbers are masked so a matric or IC number can never leak.
      unreadableRows: (courses.length ? unreadable : lines.filter((l) => COURSE_CODE_HINT.test(l)))
        .slice(0, 5)
        .map(maskRow),
    },
  };
};

const COURSE_CODE_HINT = /\b[A-Z]{3,4}\s?\d{4}\b/;
// A line that mentions a weekday and a clock time is meant to be a class slot.
const DAY_HINT = /\b(?:MON|TUES?|WED|THU(?:RS?)?|FRI|SAT|SUN)\b|\b[MTWF]H?(?:-[MTWF]H?)+\b/;
const TIME_HINT = /\d{1,2}[.:]\d{2}/;
const looksLikeSlot = (text) => DAY_HINT.test(text) && TIME_HINT.test(text);

// Matric numbers (7 digits) and IC numbers (12) are the only long numbers on a slip;
// course codes, sections and times are all 4 digits or fewer.
const maskRow = (line) =>
  line
    .replace(/\d{6}-\d{2}-\d{4}/g, '###') // IC written with dashes
    .replace(/\d{5,}/g, '###')
    .slice(0, 120);

// page.getTextContent() uses `for await` over a ReadableStream, which iOS Safari does
// not support (even in pdf.js's legacy build), so drain the stream with a reader instead.
const readTextItems = async (page) => {
  const reader = page.streamTextContent().getReader();
  const items = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    items.push(...value.items);
  }
  return items;
};

// pdf.js returns text in arbitrary chunks; rebuild visual lines from item positions
// so parsing does not depend on how the PDF happened to split its text.
const groupIntoLines = (items) => {
  const rows = [];
  const tolerance = 3;

  for (const item of items) {
    const str = item.str;
    if (!str || !str.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    let row = rows.find((r) => Math.abs(r.y - y) <= tolerance);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, str });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((r) =>
      r.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
};

export const processLines = (lines) => {
  const courses = [];
  const unreadable = [];
  let current = null;

  for (const line of lines) {
    const row = line.match(COURSE_ROW);
    if (row) {
      const [, dept, num, section, status, rest] = row;
      const code = `${dept} ${num}`;
      current = {
        id: code,
        code,
        section,
        status,
        title: '',
        creditHours: null,
        color: defaultColors[courses.length % defaultColors.length],
        schedules: [],
        isUnscheduled: true,
      };

      const detail = rest.match(COURSE_REST);
      if (detail) {
        const [, title, chr, days, start, end, period, venue] = detail;
        current.title = title.trim();
        current.creditHours = Number(chr);
        if (days) addSlots(current, days, start, end, period, venue);
      } else {
        current.title = rest.trim();
      }

      // The row names a day and time but none could be read: a format we don't know yet.
      if (current.isUnscheduled && looksLikeSlot(rest)) unreadable.push(line);

      courses.push(current);
      continue;
    }

    // Courses like LEED 1301 list additional days on the lines below the main row.
    const extra = current && line.match(EXTRA_SLOT);
    if (extra) {
      const [, days, start, end, period, venue] = extra;
      addSlots(current, days, start, end, period, venue);
      continue;
    }

    const wrapped = current && line.match(WRAPPED_SLOT);
    if (wrapped) {
      const [, titlePart, days, start, end, period, venue] = wrapped;
      current.title = `${current.title}${current.title.endsWith('-') ? '' : ' '}${titlePart.trim()}`.trim();
      addSlots(current, days, start, end, period, venue);
      continue;
    }

    // Anything else (footer, "Total", notes) ends the current course's block.
    if (/^Total\b/i.test(line) || /^Notes/i.test(line)) {
      current = null;
      continue;
    }

    if (current && looksLikeSlot(line)) unreadable.push(line);
  }

  for (const course of courses) course.shortName = abbreviate(course.title);
  return { courses, unreadable };
};

// Words left out of short names: "Data Structures and Algorithm" is DSA, not DSAA.
// "al" is the Arabic article in titles like "Fiqh al-Maqasid".
const MINOR_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'the', 'to', 'with', 'al', 'el']);
const NUMERAL = /^(?:[IVX]+|\d+)$/i;

// What a class block is titled with, per the "Course label" setting. With 'both', the
// short name leads and the code follows. A course without a short name uses its code.
export const courseLabels = (course, label = 'code') => {
  const short = (course.shortName || '').trim();
  if (label === 'code' || !short) return { primary: course.code, secondary: '' };
  return { primary: short, secondary: label === 'both' ? course.code : '' };
};

// First letter of each word, e.g. "Data Structures and Algorithm" -> "DSA".
// Hyphenated words count each part ("Co-Curriculum" -> "CC"); numbers and roman
// numerals stay whole ("Calculus II" -> "CII").
export const abbreviate = (title) =>
  (title || '')
    .split(/[\s\-–/]+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ''))
    .filter((word) => word && !MINOR_WORDS.has(word.toLowerCase()))
    .map((word) => (NUMERAL.test(word) && word !== 'I' ? word.toUpperCase() : word[0].toUpperCase()))
    .join('');

const addSlots = (course, daysStr, startStr, endStr, period, venue) => {
  const days = daysStr
    .split('-')
    .map((d) => DAY_ALIASES[d])
    .filter(Boolean);
  const { start, end } = toMinutesRange(startStr, endStr, period);
  // Some slips print the room number twice ("AIKOL MM 2.5 2.5"); keep one.
  const cleanVenue = (venue || '').trim().replace(/(\S+)\s+\1$/, '$1');

  for (const day of days) {
    course.schedules.push({
      day,
      start,
      end,
      time: `${formatTime(start)} - ${formatTime(end)}`,
      venue: cleanVenue,
    });
  }
  if (days.length) course.isUnscheduled = false;
};

// The slip prints a single AM/PM for the whole range, but inconsistently: it can belong
// to the end ("11.30 - 12.50 PM" is 11:30 AM-12:50 PM) or to the start ("9.00 - 1 AM"
// is 9 AM-1 PM). So try both 12-hour readings of each end and keep the most plausible:
// ends after it starts, within class hours, and agreeing with the printed period.
const EARLIEST = 7 * 60;
const LATEST = 23 * 60;
const LONGEST = 8 * 60;

export const toMinutesRange = (startStr, endStr, period) => {
  const parse = (s) => {
    const [h, m = 0] = s.split(/[.:]/).map(Number);
    return (h % 12) * 60 + m;
  };
  const startBase = parse(startStr);
  const endBase = parse(endStr);
  const isPm = (minutes) => minutes >= 12 * 60;

  let best = null;
  for (const start of [startBase, startBase + 12 * 60]) {
    for (const end of [endBase, endBase + 12 * 60]) {
      if (start < EARLIEST || end > LATEST || end <= start || end - start > LONGEST) continue;
      // Matching the period on the end time is the more common layout, so weigh it higher.
      const score = period ? (isPm(end) === (period === 'PM') ? 2 : 0) + (isPm(start) === (period === 'PM') ? 1 : 0) : 0;
      // Ties (e.g. no period printed) go to the earlier, more typical daytime slot.
      if (!best || score > best.score || (score === best.score && start < best.start)) {
        best = { start, end, score };
      }
    }
  }

  // Nothing plausible: fall back to the literal numbers so the class still shows up.
  return best ? { start: best.start, end: best.end } : { start: startBase, end: Math.max(endBase, startBase + 60) };
};

export const formatTime = (minutes, format = '12h') => {
  const h24 = Math.floor(minutes / 60);
  const mm = String(minutes % 60).padStart(2, '0');
  if (format === '24h') return `${String(h24).padStart(2, '0')}:${mm}`;
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${suffix}`;
};

// "10:00–11:20 AM" when both ends share a period, "11:30 AM–12:50 PM" when they don't.
export const formatRange = (start, end, format = '12h') => {
  const from = formatTime(start, format);
  const to = formatTime(end, format);
  if (format === '12h' && from.slice(-2) === to.slice(-2)) return `${from.slice(0, -3)}–${to}`;
  return `${from}–${to}`;
};

// Axis label for the top of each hour row.
export const formatHour = (hour, format = '12h') => {
  if (format === '24h') return `${String(hour).padStart(2, '0')}:00`;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`;
};

export const slotKey = (course, schedule) => `${course.id}-${schedule.day}-${schedule.start}`;

// Classes at the same time (a clash, or alternative tutorial slots) share their day's
// column side by side instead of hiding each other. Returns slotKey -> { lane, lanes }:
// the block's position and how many lanes its group of overlapping classes needs.
export const layoutLanes = (courses) => {
  const slots = courses.flatMap((course) =>
    (course.schedules || []).map((schedule) => ({ key: slotKey(course, schedule), ...schedule }))
  );
  const result = new Map();
  for (const day of DAY_ORDER) {
    const daySlots = slots.filter((s) => s.day === day).sort((a, b) => a.start - b.start || b.end - a.end);
    let group = [];
    let laneEnds = [];
    let groupEnd = -1;
    const closeGroup = () => {
      for (const s of group) result.set(s.key, { lane: s.lane, lanes: laneEnds.length });
      group = [];
      laneEnds = [];
    };
    for (const slot of daySlots) {
      if (slot.start >= groupEnd) closeGroup();
      let lane = laneEnds.findIndex((end) => end <= slot.start);
      if (lane === -1) lane = laneEnds.push(0) - 1;
      laneEnds[lane] = slot.end;
      group.push({ ...slot, lane });
      groupEnd = Math.max(groupEnd, slot.end);
    }
    closeGroup();
  }
  return result;
};

// Timetable rows are 10-minute slots starting at `dayStartHour`.
export const calculateGridPosition = (schedule, dayStartHour = 8) => {
  const offset = dayStartHour * 60;
  const startRow = Math.max(1, Math.round((schedule.start - offset) / 10) + 1);
  const endRow = Math.round((schedule.end - offset) / 10) + 1;
  return { startRow, span: Math.max(1, endRow - startRow) };
};

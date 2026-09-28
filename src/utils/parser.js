// The legacy build is transpiled for older browsers such as iOS Safari.
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
// Vite does not resolve bare package paths inside `new URL(..., import.meta.url)`,
// so the worker must be imported as an asset URL instead.
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { COURSE_PALETTE } from './theme';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

// Timetable columns: always Mon-Fri, plus weekend days only when a class falls on them.
export const visibleDays = (schedules) => {
  const usedDays = new Set(schedules.map((s) => s.day));
  return DAY_ORDER.filter((d) => WEEKDAYS.includes(d) || usedDays.has(d));
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
const TIME = '(\\d{1,2}[.:]\\d{2})\\s*-\\s*(\\d{1,2}[.:]\\d{2})\\s*(AM|PM)?';

// "BICS 2301 3 R Enterprise Networks 3 T-TH 11.30 - 12.50 PM ICT CISCO LAB LEVEL 4C"
const COURSE_ROW = /^([A-Z]{3,4})\s*(\d{4}[A-Z]?)\s+(\d{1,3})\s+([A-Z]{1,2})\s+(.*)$/;
// Remainder after status: "<title> <chr> [<days> <time> <period> <venue>]"
const COURSE_REST = new RegExp(`^(.*?)\\s+(\\d{1,2})(?:\\s+(${DAYS})\\s+${TIME}\\s*(.*))?$`);
// Continuation line for a course with extra slots: "MON 2.00 - 3.30 PM [venue]"
const EXTRA_SLOT = new RegExp(`^(${DAYS})\\s+${TIME}\\s*(.*)$`);

const defaultColors = COURSE_PALETTE.map((c) => c.hex);

// "Session : 2026/2027 Semester : 1"
const SESSION = /Session\s*:\s*(\d{4}\s*\/\s*\d{4})\s+Semester\s*:\s*(\d)/i;

export const parseConfirmationSlip = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    lines.push(...groupIntoLines(await readTextItems(page)));
  }

  const session = lines.join(' ').match(SESSION);
  return {
    courses: processLines(lines),
    semester: session ? `Semester ${session[2]}, ${session[1].replace(/\s/g, '')}` : '',
  };
};

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

    // Anything else (footer, "Total", notes) ends the current course's block.
    if (/^Total\b/i.test(line) || /^Notes/i.test(line)) current = null;
  }

  return courses;
};

const addSlots = (course, daysStr, startStr, endStr, period, venue) => {
  const days = daysStr
    .split('-')
    .map((d) => DAY_ALIASES[d])
    .filter(Boolean);
  const { start, end } = toMinutesRange(startStr, endStr, period);
  const cleanVenue = (venue || '').trim();

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

// The slip prints a single AM/PM after the range, which applies to the end time
// ("11.30 - 12.50 PM" is 11:30 AM to 12:50 PM), so derive the start from the end.
export const toMinutesRange = (startStr, endStr, period) => {
  const parse = (s) => s.split(/[.:]/).map(Number);
  const [sh, sm] = parse(startStr);
  const [eh, em] = parse(endStr);

  const to24 = (h, p) => {
    if (p === 'PM') return h === 12 ? 12 : h + 12;
    if (p === 'AM') return h === 12 ? 0 : h;
    // No period printed: classes run 8am-10pm, so small hours are afternoon.
    return h < 8 ? h + 12 : h;
  };

  const end = to24(eh, period) * 60 + em;
  let start = to24(sh, period) * 60 + sm;
  if (start >= end) start -= 12 * 60;
  if (start < 0 || start >= end) start = sh * 60 + sm;

  return { start, end };
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

// Timetable rows are 10-minute slots starting at `dayStartHour`.
export const calculateGridPosition = (schedule, dayStartHour = 8) => {
  const offset = dayStartHour * 60;
  const startRow = Math.max(1, Math.round((schedule.start - offset) / 10) + 1);
  const endRow = Math.round((schedule.end - offset) / 10) + 1;
  return { startRow, span: Math.max(1, endRow - startRow) };
};

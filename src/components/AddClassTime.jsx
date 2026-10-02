import { useState } from 'react';
import { Clock, Plus } from 'lucide-react';
import { DAY_LABELS, DAY_ORDER } from '../utils/parser';

const inputClass =
  'w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink transition-colors hover:border-teal/40';

// "14:30" -> 870 minutes after midnight.
const toMinutes = (value) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

// The phone's own time picker. Grid cells can't squeeze it below Safari's built-in width
// unless it's allowed to shrink (min-w-0), and iPhone Safari shows an empty time box as
// blank, so "Set time" fills it until it's tapped.
function TimeField({ label, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <label className="block min-w-0 text-[0.8125rem] text-muted">
      {label}
      <span className="relative mt-1 block">
        <input
          type="time"
          step={300}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`time-input block h-9 min-w-0 appearance-none ${inputClass}`}
        />
        {!value && !focused && (
          <span className="pointer-events-none absolute inset-px flex items-center gap-1.5 overflow-hidden rounded-md bg-surface px-2 text-sm whitespace-nowrap text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0 max-[359px]:hidden" />
            Set time
          </span>
        )}
      </span>
    </label>
  );
}

// A small form for entering class times the slip doesn't have, e.g. when a department
// hasn't set them yet. Several days can share one time, like "M-W" on a slip.
export default function AddClassTime({ existing, startOpen = false, onAdd }) {
  const [open, setOpen] = useState(startOpen);
  const [days, setDays] = useState([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [venue, setVenue] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setDays([]);
    setStart('');
    setEnd('');
    setVenue('');
    setError('');
  };

  const toggleDay = (day) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const submit = (e) => {
    e.preventDefault();
    if (!days.length) return setError('Choose at least one day.');
    if (!start || !end) return setError('Enter when the class starts and ends.');
    const from = toMinutes(start);
    const to = toMinutes(end);
    if (to <= from) return setError('The class must end after it starts.');
    const slots = DAY_ORDER.filter((d) => days.includes(d)).map((day) => ({
      day,
      start: from,
      end: to,
      venue: venue.trim(),
    }));
    const fresh = slots.filter(
      (s) => !existing.some((listed) => listed.day === s.day && listed.start === s.start && listed.end === s.end)
    );
    if (!fresh.length) return setError('That class time is already listed.');
    onAdd(fresh);
    reset();
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.8125rem] font-medium text-teal transition-colors hover:bg-teal-wash"
      >
        <Plus className="h-4 w-4" />
        Add class time
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-3 rounded-lg border border-line bg-limestone/60 p-3">
      <div>
        <div className="mb-1.5 text-[0.8125rem] text-muted">Days</div>
        <div className="flex flex-wrap gap-1.5">
          {DAY_ORDER.map((day) => (
            <button
              key={day}
              type="button"
              aria-pressed={days.includes(day)}
              onClick={() => toggleDay(day)}
              className={`rounded-md border px-2 py-1 text-[0.8125rem] transition-colors ${
                days.includes(day)
                  ? 'border-teal bg-teal font-semibold text-limestone'
                  : 'border-line bg-surface text-ink hover:border-teal/40'
              }`}
            >
              {DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TimeField label="Starts" value={start} onChange={setStart} />
        <TimeField label="Ends" value={end} onChange={setEnd} />
      </div>

      <label className="block text-[0.8125rem] text-muted">
        Venue (optional)
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          maxLength={40}
          placeholder="e.g. ENG LRM E0-1-15"
          className={`mt-1 ${inputClass}`}
        />
      </label>

      {error && (
        <p role="alert" className="text-[0.8125rem] text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-teal px-3 py-1.5 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-teal-wash hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

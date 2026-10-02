import { useState } from 'react';
import { Plus } from 'lucide-react';
import { DAY_LABELS, DAY_ORDER } from '../utils/parser';

const inputClass =
  'w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-ink transition-colors hover:border-teal/40';

// "14:30" -> 870 minutes after midnight.
const toMinutes = (value) => {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

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

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <label className="text-[0.8125rem] text-muted">
          Starts
          <input type="time" step={300} value={start} onChange={(e) => setStart(e.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <span className="pb-2 text-[0.8125rem] text-muted">to</span>
        <label className="text-[0.8125rem] text-muted">
          Ends
          <input type="time" step={300} value={end} onChange={(e) => setEnd(e.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
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

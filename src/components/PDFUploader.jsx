import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { parseConfirmationSlip } from '../utils/parser';
import Khatam from './Khatam';

const STEPS = [
  'Log in to i-Ma’luum. On the home page, find Favourite Links.',
  'Select Confirmation Slip, then Print, and save it as a PDF.',
  'Upload that PDF here.',
];

export default function PDFUploader({ onDataParsed }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    const looksLikePdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!looksLikePdf) {
      setErrorMsg('That file isn’t a PDF. Save your confirmation slip as a PDF and upload it again.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const parsed = await parseConfirmationSlip(file);
      if (!parsed.courses.length) {
        setErrorMsg(
          'No courses were found in this PDF. Check that it’s the Course Registration Confirmation Slip from i-Ma’luum.'
        );
        return;
      }
      onDataParsed(parsed);
    } catch (err) {
      console.error('PDF parsing error:', err);
      setErrorMsg(
        `This PDF couldn’t be read (${err?.message || 'unknown error'}). Try saving the slip from i-Ma’luum again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    // Phones: intro, upload box, then steps, so the upload is reachable without scrolling.
    // Desktop: intro and steps on the left, upload box spanning both rows on the right.
    <section className="grid gap-8 py-6 lg:grid-cols-[1.05fr_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8 lg:py-14">
      <div className="order-1 max-w-xl lg:order-none lg:self-end">
        <h1 className="font-kufi text-[2.25rem] leading-[1.08] font-semibold text-ink sm:text-[3.25rem]">
          Your confirmation slip, as a weekly timetable.
        </h1>
        <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-muted sm:mt-5 sm:text-[1.0625rem]">
          Upload the PDF from i-Ma’luum to see your classes laid out by day. Recolor each course, then save it as an
          image or a phone wallpaper.
        </p>
      </div>

      <div className="order-3 max-w-xl lg:order-none lg:col-start-1 lg:row-start-2">
        <ol className="space-y-3">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-3.5 text-[0.9375rem] text-ink">
              <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-semibold text-teal tabular-nums">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-muted">
          Your slip is read in this browser. It never leaves your device.
        </p>
      </div>

      <div className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
        <label
          htmlFor="pdf-upload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative flex aspect-[5/4] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border bg-surface px-6 text-center transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal ${
            isDragging ? 'border-teal bg-teal-wash' : 'border-line hover:border-teal/50'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="relative flex h-32 w-32 items-center justify-center">
              <Khatam
                size={128}
                strokeWidth={1.6}
                color="var(--color-brass)"
                className="khatam-turn pointer-events-none absolute inset-0"
                style={{ transform: `rotate(${isDragging ? 45 : 0}deg)` }}
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-teal text-limestone">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Khatam size={26} strokeWidth={7} />}
              </span>
            </span>
            <span className="mt-4 text-lg font-semibold text-ink">
              {loading ? 'Reading your slip…' : isDragging ? 'Drop to upload' : 'Upload confirmation slip'}
            </span>
            {!loading && (
              <>
                <span className="mt-1.5 text-sm text-muted">Drag the PDF here, or choose a file</span>
                <span className="mt-6 inline-flex items-center rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-limestone transition-colors group-hover:bg-teal-deep">
                  Choose PDF
                </span>
              </>
            )}
          </div>

          <input
            id="pdf-upload"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={loading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {errorMsg && (
          <p role="alert" className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}

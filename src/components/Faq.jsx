import ReportLink from './ReportLink';

// Shown under the upload box. Besides answering common questions, this is the page's
// main text for search engines, so it uses the words students search with
// ("IIUM schedule", "timetable", "i-Ma'luum", "confirmation slip").
const QUESTIONS = [
  {
    q: 'What is SlipSnap?',
    a: 'SlipSnap (formerly the IIUM Schedule Converter) is a free tool that turns the Course Registration Confirmation Slip from i-Ma’luum into a weekly class timetable. You can recolor each course and save your IIUM schedule as an image or as a lock screen wallpaper for your phone or iPad.',
  },
  {
    q: 'Where do I find my confirmation slip?',
    a: 'Log in to i-Ma’luum. On the home page, open Favourite Links, choose Confirmation Slip, then Print, and save it as a PDF. Upload that PDF here.',
  },
  {
    q: 'Is my slip safe?',
    a: 'Yes. The PDF is read entirely in your browser, on your device. Your slip, name, matric and IC number are never uploaded anywhere.',
  },
  {
    q: 'Which phones does the wallpaper fit?',
    a: 'iPhones from the SE to the 17 Pro Max, most Android phones including Samsung Galaxy and Xiaomi, and iPads in portrait or landscape. On a phone, “Match this device” sizes it to your screen.',
  },
  {
    q: 'Is this an official IIUM website?',
    a: 'No. It’s an unofficial student project, not affiliated with IIUM. It only reads the slip you already have.',
  },
];

export default function Faq() {
  return (
    <section aria-labelledby="faq-title" className="border-t border-line py-10 lg:py-14">
      <h2 id="faq-title" className="font-kufi text-2xl font-semibold text-ink sm:text-[1.75rem]">
        Questions about SlipSnap, the IIUM schedule converter
      </h2>
      <dl className="mt-6 grid gap-x-12 gap-y-6 lg:grid-cols-2">
        {QUESTIONS.map(({ q, a }) => (
          <div key={q}>
            <dt className="text-[0.9375rem] font-semibold text-ink">{q}</dt>
            <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{a}</dd>
          </div>
        ))}
        <div>
          <dt className="text-[0.9375rem] font-semibold text-ink">My timetable looks wrong. What should I do?</dt>
          <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">
            Slips differ between kulliyyahs and semesters, so a few rows may not be read yet.{' '}
            <ReportLink>Report it on GitHub</ReportLink> with the affected row and it can be fixed.
          </dd>
        </div>
      </dl>
    </section>
  );
}

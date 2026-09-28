import { useState } from 'react';
import { REPORT_ISSUE_URL } from '../config';
import { sendReport } from '../utils/analytics';

// Opt-in error report. Shows exactly what would be sent (the reason and any masked
// timetable rows) and sends nothing until the student taps the button.
export default function ReportPanel({ reason, rows = [] }) {
  const [status, setStatus] = useState('idle');

  const handleSend = () => setStatus(sendReport(reason, rows) ? 'sent' : 'blocked');

  return (
    <div className="mt-3 rounded-lg border border-line bg-surface p-4 text-sm text-ink">
      <p className="font-semibold">Help fix this</p>
      <p className="mt-1 text-muted">
        {rows.length
          ? 'Send an anonymous report so this slip format can be supported. It includes only the rows below, with long numbers hidden. Your name, matric and IC number are never sent.'
          : 'Send an anonymous report of what went wrong. Nothing from your slip is included.'}
      </p>

      {rows.length > 0 && (
        <pre className="mt-3 overflow-x-auto rounded-md bg-limestone px-3 py-2 text-xs leading-relaxed text-ink">
          {rows.join('\n')}
        </pre>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {status === 'idle' && (
          <button
            type="button"
            onClick={handleSend}
            className="rounded-lg bg-teal px-3.5 py-2 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep"
          >
            Send anonymous report
          </button>
        )}
        {status === 'sent' && <p className="font-medium text-teal">Report sent. Thank you!</p>}
        {status === 'blocked' && (
          <p className="text-danger">The report couldn’t be sent, possibly because of an ad blocker.</p>
        )}
        <a
          href={REPORT_ISSUE_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-teal underline-offset-4 hover:underline"
        >
          {status === 'blocked' ? 'Report it on GitHub instead' : 'Or describe it on GitHub'}
        </a>
      </div>
    </div>
  );
}

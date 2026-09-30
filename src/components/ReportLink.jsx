import { reportIssueUrl } from '../config';

// Link to the GitHub report form, shown under every error. `fields` pre-fills the form
// (see reportIssueUrl) so students don't have to retype the error.
export default function ReportLink({ fields, children = 'Report this problem on GitHub', className = '' }) {
  return (
    <a
      href={reportIssueUrl(fields)}
      target="_blank"
      rel="noreferrer"
      className={`font-medium text-teal underline underline-offset-4 hover:text-teal-deep ${className}`}
    >
      {children}
    </a>
  );
}

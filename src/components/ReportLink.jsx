import { reportIssueUrl } from '../config';
import { technicalDetails } from '../utils/diagnostics';

// Link to the GitHub report form, shown under every error. `fields` pre-fills the form
// (see reportIssueUrl) so students don't have to retype the error. The browser and the
// last error's location are added too, read when the link is opened so they're current.
export default function ReportLink({ fields, children = 'Report this problem on GitHub', className = '' }) {
  const url = () => reportIssueUrl({ ...fields, technical: technicalDetails() });
  const open = (e) => {
    e.currentTarget.href = url();
  };
  return (
    <a
      href={url()}
      onClick={open}
      onAuxClick={open}
      onContextMenu={open}
      target="_blank"
      rel="noreferrer"
      className={`font-medium text-teal underline underline-offset-4 hover:text-teal-deep ${className}`}
    >
      {children}
    </a>
  );
}

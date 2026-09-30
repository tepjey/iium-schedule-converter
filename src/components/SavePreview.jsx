import { useEffect, useMemo, useRef } from 'react';
import { X } from 'lucide-react';
import { shareImage, downloadImage } from '../utils/exporter';
import ReportLink from './ReportLink';

// Shown on phones when the share sheet couldn't open by itself (Safari only allows it
// right after a tap, and rendering takes a moment) or isn't available at all, as in the
// built-in browsers of Instagram, TikTok and similar apps. The button here is a fresh
// tap, and the image itself can always be saved with a long-press.
// `url` is an object URL for `file`, owned (and revoked) by the parent.
export default function SavePreview({ file, url, inAppBrowser, onClose }) {
  const dialogRef = useRef(null);
  const canShare = useMemo(() => !!navigator.canShare?.({ files: [file] }), [file]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleShare = async () => {
    if ((await shareImage(file)) === 'unavailable') downloadImage(file);
  };

  const buttonClass =
    'flex w-full items-center justify-center rounded-lg bg-teal px-4 py-3 text-[0.9375rem] font-semibold text-limestone transition-colors hover:bg-teal-deep';

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="save-preview-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 id="save-preview-title" className="text-base font-semibold">
          Your image is ready
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="-mr-2 rounded-lg p-2 text-muted transition-colors hover:bg-teal-wash hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-4 text-sm">
        <img
          src={url}
          alt="Your timetable image"
          className="mx-auto max-h-[50vh] w-auto rounded-lg border border-line object-contain"
        />

        {inAppBrowser && (
          <p className="rounded-lg border border-brass/40 bg-brass/5 px-3 py-2 text-ink">
            You’re in an app’s built-in browser, which often blocks saving. If nothing works, open this page in Safari
            or Chrome from the app’s menu.
          </p>
        )}

        {canShare ? (
          <button type="button" onClick={handleShare} className={buttonClass}>
            Save image
          </button>
        ) : (
          <a href={url} download={file.name} className={buttonClass}>
            Download image
          </a>
        )}

        <p className="text-muted">
          Didn’t save? Press and hold the image above, then choose <strong className="text-ink">Save to Photos</strong>{' '}
          or <strong className="text-ink">Download image</strong>.
        </p>
        <p className="text-muted">
          Still stuck?{' '}
          <ReportLink fields={{ result: 'Saving the image didn’t work.' }} />
        </p>
      </div>
    </dialog>
  );
}

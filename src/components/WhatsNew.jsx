import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ANNOUNCEMENT, markAnnouncementSeen } from '../utils/announcement';

export default function WhatsNew({ onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleClose = () => {
    markAnnouncementSeen();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby="whats-new-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-3">
        <h2 id="whats-new-title" className="text-base font-semibold">
          {ANNOUNCEMENT.title}
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

      <ul className="space-y-4 px-5 py-4 text-sm">
        {ANNOUNCEMENT.items.map((item) => (
          <li key={item.title} className="flex gap-3">
            <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
            <span>
              <span className="block font-semibold text-ink">{item.title}</span>
              <span className="text-muted">{item.body}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="flex w-full items-center justify-center rounded-lg bg-teal px-4 py-3 text-[0.9375rem] font-semibold text-limestone transition-colors hover:bg-teal-deep"
        >
          Got it
        </button>
      </div>
    </dialog>
  );
}

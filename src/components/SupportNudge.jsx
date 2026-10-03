import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SUPPORT_URL } from '../config';
import { trackEvent } from '../utils/analytics';

// A small note after a wallpaper or timetable is saved: the moment a student is happiest
// with the site is the best moment to mention the tip jar. It hides itself after a while.
export default function SupportNudge({ layout, onClose }) {
  useEffect(() => {
    trackEvent('support-nudge-shown', 'Support note shown');
    const timer = setTimeout(onClose, 15000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-28 z-20 mx-auto max-w-sm rounded-2xl border border-line bg-surface p-4 shadow-[0_18px_40px_-18px_rgba(13,47,46,0.45)] lg:right-6 lg:bottom-6 lg:left-auto lg:mx-0"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="text-2xl leading-none">
          ☕
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-ink">{layout === 'wallpaper' ? 'Wallpaper saved!' : 'Timetable saved!'}</p>
          <p className="mt-0.5 text-muted">
            Free for every IIUM student, always. Enjoying it?{' '}
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackEvent('support-nudge-click', 'Support note clicked')}
              className="font-medium text-teal underline underline-offset-4 hover:text-teal-deep"
            >
              Buy me a coffee
            </a>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-teal-wash hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { resolveTheme } from './themeModel';

// Shown when the page is opened from a theme share link (#theme=...).
export default function SharedThemeDialog({ theme, onAdd, onClose }) {
  const dialogRef = useRef(null);
  const colors = resolveTheme(theme);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="shared-theme-title"
      className="m-auto w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/60"
    >
      <div className="space-y-4 p-5">
        <div
          className="flex h-28 items-end justify-center rounded-xl px-6 pb-4"
          style={{ background: colors.wallpaperBackground }}
        >
          <div className="h-14 w-full rounded-md" style={{ background: colors.background, border: `1px solid ${colors.border}` }}>
            <div className="h-4 rounded-t-md" style={{ background: colors.headerBackground, borderBottom: `1px solid ${colors.border}` }} />
          </div>
        </div>
        <div>
          <h2 id="shared-theme-title" className="text-base font-semibold">
            Someone shared a theme with you
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add <strong className="text-ink">{theme.name}</strong> to your themes? You can change it in the Theme Studio
            afterwards.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onAdd(theme);
              dialogRef.current?.close();
            }}
            className="flex-1 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep"
          >
            Add theme
          </button>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-teal-wash hover:text-ink"
          >
            Not now
          </button>
        </div>
      </div>
    </dialog>
  );
}

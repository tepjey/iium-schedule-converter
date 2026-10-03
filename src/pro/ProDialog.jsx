import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Image, LayoutGrid, Loader2, Smile, Sparkles, Type } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { PRO_PRICE } from './proModel';

const PERKS = [
  { Icon: Image, text: 'Your own photo as the background, with frosted glass' },
  { Icon: Smile, text: 'Stickers and sticky notes on your wallpaper' },
  { Icon: Type, text: 'Six extra fonts' },
  { Icon: LayoutGrid, text: 'Solid, outline and glass class blocks' },
];

const post = async (path, body) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Try again in a moment.');
  return data;
};

const PRIMARY =
  'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep disabled:opacity-70';
const SECONDARY =
  'w-full rounded-lg px-4 py-2.5 text-sm font-medium text-teal transition-colors hover:bg-teal-wash disabled:opacity-70';
const INPUT = 'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal';

// SlipSnap Pro: what it adds, buying it (Stripe Checkout), restoring it, and the key after
// paying. `view` is where it opens: 'offer', 'restore' or 'claim' (back from Checkout with
// `session`). `features` are the Pro features the design being saved uses; with
// `onSaveWithout`, the offer can save the image without them instead. 'unlocked' shows
// `currentKey`, for using Pro on another device.
export default function ProDialog({
  view: initialView = 'offer',
  session,
  features = [],
  unlock,
  currentKey = '',
  onSaveWithout,
  onClose,
}) {
  const dialogRef = useRef(null);
  const [view, setView] = useState(initialView);
  const [busy, setBusy] = useState(initialView === 'claim');
  const [error, setError] = useState('');
  const [key, setKey] = useState(currentKey);
  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState('');
  const [email, setEmail] = useState('');
  const [receipt, setReceipt] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    dialog?.focus();
  }, []);

  const finish = async (newKey, how) => {
    if (!(await unlock(newKey))) throw new Error('That key isn’t a SlipSnap Pro key. Check that it was copied in full.');
    trackEvent(`pro-unlocked: ${how}`, 'Pro unlocked');
    setKey(newKey);
    setView('unlocked');
  };

  // Back from Stripe Checkout: swap the payment for a key.
  useEffect(() => {
    if (initialView !== 'claim') return;
    post('/api/claim', { session })
      .then(({ key: newKey }) => finish(newKey, 'paid'))
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
    // Runs once, for the session the dialog opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const buy = () =>
    run(async () => {
      trackEvent('pro-checkout', 'Pro checkout started');
      const { url } = await post('/api/checkout');
      window.location.assign(url);
      // Stays busy while the payment page loads.
      await new Promise(() => {});
    });

  const restoreByEmail = (e) => {
    e.preventDefault();
    run(async () => {
      const { key: newKey } = await post('/api/restore', { email, receipt });
      await finish(newKey, 'restored');
    });
  };

  const restoreByKey = (e) => {
    e.preventDefault();
    run(() => finish(pasted, 'key'));
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
    } catch {
      // The key is still on screen to select by hand.
    }
  };

  const close = () => dialogRef.current?.close();

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      onClose={onClose}
      aria-labelledby="pro-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-0 text-ink outline-none backdrop:bg-ink/60"
    >
      <div className="space-y-4 p-5">
        {view === 'offer' && (
          <>
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brass uppercase">
                <Sparkles className="h-3.5 w-3.5" /> SlipSnap Pro
              </p>
              <h2 id="pro-title" className="mt-1 font-kufi text-2xl font-semibold">
                {features.length ? 'This design uses Pro' : 'Make it yours with Pro'}
              </h2>
              {features.length > 0 && <p className="mt-1 text-sm text-muted">{features.join(', ')}.</p>}
            </div>
            <ul className="space-y-2">
              {PERKS.map(({ Icon, text }) => (
                <li key={text} className="flex gap-2.5 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                  {text}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted">
              <strong className="text-ink">{PRO_PRICE}, once.</strong> No subscription. Pay with online banking (FPX),
              card or GrabPay. Everything else in SlipSnap stays free.
            </p>
            <div className="space-y-1.5">
              <button type="button" onClick={buy} disabled={busy} className={PRIMARY}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Get Pro for {PRO_PRICE}
              </button>
              {onSaveWithout && (
                <button
                  type="button"
                  onClick={() => {
                    onSaveWithout();
                    close();
                  }}
                  disabled={busy}
                  className={SECONDARY}
                >
                  Save without Pro features
                </button>
              )}
              <button type="button" onClick={() => setView('restore')} className={SECONDARY}>
                I already have Pro
              </button>
            </div>
          </>
        )}

        {view === 'restore' && (
          <>
            <div>
              <h2 id="pro-title" className="font-kufi text-2xl font-semibold">
                Restore Pro
              </h2>
              <p className="mt-1 text-sm text-muted">For a new phone or browser. Use either way.</p>
            </div>
            <form onSubmit={restoreByEmail} className="space-y-2">
              <p className="text-sm font-semibold">With your receipt</p>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email you paid with"
                autoComplete="email"
                className={INPUT}
              />
              <input
                required
                value={receipt}
                onChange={(e) => setReceipt(e.target.value)}
                placeholder="Receipt number, like 1234-5678"
                className={INPUT}
              />
              <button type="submit" disabled={busy} className={PRIMARY}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Restore
              </button>
            </form>
            <form onSubmit={restoreByKey} className="space-y-2 border-t border-line pt-4">
              <p className="text-sm font-semibold">With your Pro key</p>
              <input
                required
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                placeholder="SNAP1.…"
                spellCheck={false}
                className={`${INPUT} font-mono`}
              />
              <button type="submit" disabled={busy} className={SECONDARY}>
                Use key
              </button>
            </form>
          </>
        )}

        {view === 'claim' && (
          <div className="py-4 text-center">
            <h2 id="pro-title" className="font-kufi text-2xl font-semibold">
              {busy ? 'Unlocking Pro…' : 'Pro isn’t unlocked yet'}
            </h2>
            {busy && <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-teal" />}
            {!busy && error && (
              <div className="mt-4 space-y-1.5">
                <button
                  type="button"
                  onClick={() => run(async () => finish((await post('/api/claim', { session })).key, 'paid'))}
                  className={PRIMARY}
                >
                  Try again
                </button>
                <button type="button" onClick={() => setView('restore')} className={SECONDARY}>
                  Restore with my receipt
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'unlocked' && (
          <>
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal text-limestone">
                <Check className="h-6 w-6" />
              </span>
              <h2 id="pro-title" className="mt-3 font-kufi text-2xl font-semibold">
                Pro is unlocked
              </h2>
              <p className="mt-1 text-sm text-muted">Thank you for supporting SlipSnap! Every Pro feature is yours.</p>
            </div>
            <div className="rounded-lg bg-limestone p-3">
              <p className="text-[0.8125rem] text-muted">
                Your Pro key unlocks Pro on another phone or browser. Keep it somewhere safe, or use your receipt email
                instead.
              </p>
              <p className="mt-2 font-mono text-[0.6875rem] break-all text-ink select-all">{key}</p>
              <button
                type="button"
                onClick={copyKey}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-teal"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy key'}
              </button>
            </div>
            <button type="button" onClick={close} className={PRIMARY}>
              Done
            </button>
          </>
        )}

        {error && (
          <p role="alert" className="text-[0.8125rem] text-danger">
            {error}
          </p>
        )}

        {view !== 'unlocked' && (
          <p className="flex flex-wrap justify-center gap-x-3 text-[0.75rem] text-muted">
            <a href="terms.html" className="hover:text-ink">Terms</a>
            <a href="refunds.html" className="hover:text-ink">Refunds</a>
            <a href="privacy.html" className="hover:text-ink">Privacy</a>
            <button type="button" onClick={close} className="hover:text-ink">
              Close
            </button>
          </p>
        )}
      </div>
    </dialog>
  );
}

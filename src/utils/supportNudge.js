// When to show the "buy me a coffee" note after a save: only on a real save, and at most
// once every two weeks, so students who save often aren't nagged.
const SHOWN_KEY = 'iium.supportNudgeAt';
const EVERY = 14 * 24 * 60 * 60 * 1000;

export const shouldNudge = () => {
  try {
    const last = Number(localStorage.getItem(SHOWN_KEY)) || 0;
    if (Date.now() - last < EVERY) return false;
    localStorage.setItem(SHOWN_KEY, String(Date.now()));
    return true;
  } catch {
    // Without storage we can't space it out, so don't show it at all.
    return false;
  }
};

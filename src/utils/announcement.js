// Bump the id whenever the announcement changes; each visitor sees a given one once.
// The 2.0 tour itself (cards with pictures) is in components/WhatsNew.jsx; `alsoNew` is
// the earlier updates, listed on its last card.
export const ANNOUNCEMENT = {
  id: '2.0',
  title: 'SlipSnap 2.0',
  // A launch: first-time visitors see it too, not only returning ones.
  forEveryone: true,
  alsoNew: [
    'IIUM Timetable is now SlipSnap, at slipsnap.pages.dev',
    'Choose your tutorial times and hide the rest',
    'Add class times your slip doesn’t have',
    'Classes at the same time sit side by side',
    'Colors, short names and class times are remembered',
    'Wallpapers fit your iPhone and iPad lock screen',
    'Hide a free Friday, and short course names like DSA',
    'Fixes for long titles, repeated rows and Android uploads',
  ],
};

const SEEN_KEY = 'iium.seenAnnouncement';

// Read before the app saves any preferences, so first-time visitors can be told apart
// from returning ones. Usually only returning visitors need to hear what changed.
const isReturningVisitor = (() => {
  try {
    return Object.keys(localStorage).some((key) => key.startsWith('iium.'));
  } catch {
    return false;
  }
})();

export const shouldAnnounce = () => {
  try {
    if (localStorage.getItem(SEEN_KEY) === ANNOUNCEMENT.id) return false;
    if (!isReturningVisitor && !ANNOUNCEMENT.forEveryone) {
      markAnnouncementSeen();
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const markAnnouncementSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, ANNOUNCEMENT.id);
  } catch {
    // Storage unavailable; it may show again next visit.
  }
};

// Bump the id whenever the list changes; each visitor sees a given announcement once.
export const ANNOUNCEMENT = {
  id: '2026-10-05',
  title: 'New in SlipSnap',
  items: [
    {
      title: 'IIUM Timetable is now SlipSnap',
      body: 'Same free tool, new name and a new home at slipsnap.pages.dev. Your colors and settings came with you, and old links still work.',
    },
    {
      title: 'Choose your tutorial times',
      body: 'If your slip lists tutorial times you don’t attend, tap the course under Courses and untick them. They’re left off your timetable and wallpaper.',
    },
    {
      title: 'No class time on your slip? Add it yourself',
      body: 'If your department hasn’t set a course’s times yet, tap the course under Courses and choose Add class time once you know them.',
    },
    {
      title: 'Classes at the same time, side by side',
      body: 'Classes that overlap now share the column instead of hiding behind each other.',
    },
    {
      title: 'Your changes are remembered',
      body: 'Colors, short names, hidden class times and times you added come back when you upload the same slip again on this device.',
    },
    {
      title: 'Wallpapers that fit your lock screen',
      body: 'On iPhone and iPad, the timetable stays clear of the clock, widgets and flashlight and camera buttons. Tell it where your widgets are under Layout.',
    },
    {
      title: 'Free Friday? Hide it',
      body: 'Choose Only class days under Layout to leave out weekdays with no classes.',
    },
    {
      title: 'Short course names',
      body: 'Label classes with a short name like DSA instead of the course code, or show both. Pick Course label under Look, and tap a course to edit its short name.',
    },
    {
      title: 'Six new themes',
      body: 'Pastel Sky, Lavender and Butter for light mode, and Forest, Plum and Mocha for dark mode.',
    },
    {
      title: 'Fixes',
      body: 'Classes no longer go missing when a course title is long, a class listed twice on the slip no longer shows at half width, and Android phones can upload slips saved without a .pdf name.',
    },
  ],
};

const SEEN_KEY = 'iium.seenAnnouncement';

// Read before the app saves any preferences, so first-time visitors can be told apart
// from returning ones. Only returning visitors need to hear what changed.
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
    if (!isReturningVisitor) {
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

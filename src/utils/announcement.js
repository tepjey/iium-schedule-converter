// Bump the id whenever the list changes; each visitor sees a given announcement once.
export const ANNOUNCEMENT = {
  id: '2026-09-30',
  title: 'New in IIUM Timetable',
  items: [
    {
      title: 'Wallpapers that fit your lock screen',
      body: 'On iPhone and iPad, the timetable now stays clear of the clock, widgets and flashlight and camera buttons. Tell it where your widgets are under Layout.',
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
      body: 'Classes no longer go missing when a course title is long, and Android phones can upload slips that were saved without a .pdf name.',
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

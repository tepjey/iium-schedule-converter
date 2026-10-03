import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Link2, Sparkles, X } from 'lucide-react';
import { StickerArt } from '../studio/Decor';
import { FONTS, blockBorders, blockLook, loadFont } from '../studio/styleModel';
import { paletteFromBase } from '../studio/themeModel';
import { THEMES } from '../utils/theme';
import { ANNOUNCEMENT, markAnnouncementSeen } from '../utils/announcement';

// ---------- Small drawings for the cards (CSS only, so no image files) ----------

// A tiny phone: wallpaper `bg`, a timetable card with a few class blocks.
function MiniPhone({ bg, card, line, blocks = ['#0f766e', '#4f46e5', '#e11d48'], dark = false, className = '', style, children }) {
  return (
    <div
      className={`absolute overflow-hidden rounded-[18px] border-[3px] border-ink shadow-[0_18px_30px_-16px_rgba(13,47,46,0.55)] ${className}`}
      style={{ width: 82, height: 164, background: bg, ...style }}
    >
      <div className="absolute inset-x-1.5 top-[58px] bottom-5 overflow-hidden rounded-md" style={{ background: card, border: `1px solid ${line}` }}>
        <div className="h-2" style={{ borderBottom: `1px solid ${line}` }} />
        {blocks.map((c, i) => (
          <div
            key={c + i}
            className="absolute rounded-sm"
            style={{
              left: 4 + (i % 3) * 22,
              top: 12 + i * 17,
              width: 18,
              height: 14 + (i % 2) * 8,
              background: dark ? `${c}55` : `${c}26`,
              borderLeft: `2px solid ${c}`,
            }}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

const ArtFrame = ({ className = '', style, children }) => (
  <div className={`relative h-44 overflow-hidden rounded-xl ${className}`} style={style}>
    {children}
  </div>
);

function LaunchArt() {
  return (
    <ArtFrame style={{ background: 'radial-gradient(80% 90% at 80% 10%, #2bb3a8 0%, #0f6b66 45%, #072a28 100%)' }}>
      <div className="absolute top-5 left-5 font-kufi text-[4.5rem] leading-none font-semibold text-limestone">2.0</div>
      <div className="absolute top-[5.4rem] left-6 text-sm font-semibold tracking-wide text-brass uppercase">Make it yours</div>
      <MiniPhone
        bg="linear-gradient(180deg, #2b3a8c 0%, #8d4fa6 45%, #f08a6b 75%, #ffc27a 100%)"
        card="rgba(255,255,255,0.6)"
        line="rgba(255,255,255,0.8)"
        style={{ right: 26, top: 14, transform: 'rotate(6deg)' }}
      >
        <div className="absolute top-3 w-full text-center text-[1.05rem] font-bold text-white">9:41</div>
      </MiniPhone>
      <div className="absolute" style={{ right: 96, top: 24, width: 30, height: 30, transform: 'rotate(-12deg)' }}>
        <StickerArt icon="sparkle" color="#f59e0b" />
      </div>
      <div className="absolute" style={{ right: 12, top: 108, width: 34, height: 34, transform: 'rotate(10deg)' }}>
        <StickerArt icon="heart" color="#ec4899" />
      </div>
      <div className="absolute" style={{ right: 100, bottom: 14, width: 38, height: 38, transform: 'rotate(-6deg)' }}>
        <StickerArt icon="moon" color="#8b5cf6" />
      </div>
    </ArtFrame>
  );
}

function ColorsArt() {
  const bases = ['#db2777', '#2563eb', '#16a34a', '#ea580c'];
  return (
    <ArtFrame className="bg-limestone">
      {bases.map((base, i) => {
        const dark = i % 2 === 1;
        const p = paletteFromBase(base, dark ? 'dark' : 'light');
        return (
          <MiniPhone
            key={base}
            bg={`linear-gradient(${p.gradient.angle}deg, ${p.gradient.from}, ${p.gradient.to})`}
            card={p.background}
            line={p.border}
            dark={dark}
            blocks={[base, '#0891b2', '#ca8a04']}
            // Spread across the card's width, whatever the popup's width on this screen.
            style={{ left: `calc(${i * 25}% + ${4 - i * 14}px)`, top: 6 + (i % 2) * 8, transform: `rotate(${[-6, 3, -2, 6][i]}deg)`, zIndex: i % 2 }}
          />
        );
      })}
    </ArtFrame>
  );
}

function PhotoArt() {
  return (
    <ArtFrame
      style={{
        background:
          'radial-gradient(40% 35% at 50% 30%, #ffd27a 0%, rgba(255,210,122,0) 70%), linear-gradient(180deg, #2b3a8c 0%, #8d4fa6 40%, #f08a6b 70%, #ffc27a 100%)',
      }}
    >
      <div
        className="absolute inset-x-6 top-14 bottom-5 rounded-xl border border-white/70"
        style={{ background: 'linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), rgba(255,255,255,0.2)' }}
      >
        <div className="flex h-6 items-center gap-6 border-b border-white/70 px-3 text-[0.625rem] font-bold text-[#2b1d3d]">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute h-7 w-14 rounded-md border border-white/80 bg-white/60" style={{ left: 12 + i * 70, top: 32 + (i % 2) * 22 }} />
        ))}
      </div>
      <span className="absolute top-3 left-4 rounded-full bg-white/85 px-2.5 py-1 text-[0.6875rem] font-semibold text-ink">Frosted glass</span>
    </ArtFrame>
  );
}

function StyleArt() {
  const theme = { ...THEMES.classic, mode: 'light' };
  const styles = [
    ['tint', 'Soft tint'],
    ['solid', 'Solid'],
    ['outline', 'Outline'],
    ['glass', 'Glass'],
  ];
  const fonts = ['poppins', 'playfair', 'caveat'];
  return (
    <ArtFrame className="bg-limestone p-3">
      <div className="grid grid-cols-4 gap-1.5">
        {styles.map(([id, label]) => {
          const look = blockLook('#4f46e5', theme, { blockStyle: id });
          return (
            <div key={id} className="rounded-md p-1" style={{ background: id === 'glass' ? 'linear-gradient(135deg,#c7d2fe,#fbcfe8)' : '#ffffff' }}>
              <div className="rounded px-1.5 py-1 text-[0.6875rem] leading-tight font-bold" style={{ background: look.fill, color: look.text, ...blockBorders(look, 2) }}>
                DSA
                <span className="block font-normal opacity-80">10:00</span>
              </div>
              <span className="mt-0.5 block text-center text-[0.5625rem] text-muted">{label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-0.5 text-ink">
        {fonts.map((f) => (
          <div key={f} className="flex items-baseline justify-between">
            <span className="text-[1.25rem] leading-tight" style={{ fontFamily: FONTS[f].family }}>
              Mon 10:00
            </span>
            <span className="text-[0.6875rem] text-muted">{FONTS[f].name}</span>
          </div>
        ))}
      </div>
    </ArtFrame>
  );
}

function StickerArtPanel() {
  // [icon, color, left %, top px, size px, turn]
  const stickers = [
    ['khatam', '#0f6b66', 4, 16, 42, -8],
    ['star', '#eab308', 20, 74, 32, 12],
    ['coffee', '#a16207', 5, 112, 38, 6],
    ['flower', '#ec4899', 83, 16, 38, 10],
    ['book', '#3b82f6', 82, 110, 38, -10],
    ['music', '#8b5cf6', 66, 126, 28, 8],
  ];
  return (
    <ArtFrame style={{ background: 'linear-gradient(180deg, #e2d7f5 0%, #f4f0fb 60%, #faf8fe 100%)' }}>
      {stickers.map(([icon, color, left, top, size, rotate]) => (
        <div key={icon} className="absolute" style={{ left: `${left}%`, top, width: size, height: size, transform: `rotate(${rotate}deg)` }}>
          <StickerArt icon={icon} color={color} />
        </div>
      ))}
      <div
        className="absolute top-8 left-1/2 w-36 -translate-x-1/2 bg-[#fff3a3] px-3 pt-4 pb-3 text-[1.35rem] leading-[1.05] font-semibold text-[#2a2a2a] shadow-[0_8px_16px_-8px_rgba(0,0,0,0.45)]"
        style={{ fontFamily: FONTS.caveat.family, rotate: '-4deg' }}
      >
        <span className="absolute -top-1.5 left-1/2 h-3 w-12 -translate-x-1/2 rotate-[-2deg] bg-white/60" />
        Final exam 14 Dec. You got this!
      </div>
    </ArtFrame>
  );
}

function ShareArt() {
  return (
    <ArtFrame className="flex flex-col items-center justify-center gap-2 bg-limestone">
      <div className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-sm font-semibold text-teal shadow-[0_10px_24px_-12px_rgba(13,47,46,0.4)]">
        <Link2 className="h-4 w-4" />
        Copy share link
      </div>
      <ArrowRight className="h-4 w-4 rotate-90 text-muted" />
      <div className="flex w-60 items-center gap-3 rounded-xl border border-line bg-surface p-2.5 shadow-[0_16px_32px_-16px_rgba(13,47,46,0.45)]">
        <div className="h-12 w-12 shrink-0 rounded-lg" style={{ background: 'linear-gradient(135deg, #1e3a8a, #db2777 60%, #f59e0b)' }} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.8125rem] font-semibold text-ink">Sunset by Aisyah</div>
          <div className="mt-1 rounded-md bg-teal py-1 text-center text-[0.75rem] font-semibold text-limestone">Add theme</div>
        </div>
      </div>
    </ArtFrame>
  );
}

// ---------- The tour ----------

const CARDS = [
  {
    id: 'launch',
    Art: LaunchArt,
    title: 'Welcome to IIUM Timetable 2.0',
    body: 'Your timetable, your style. Design a wallpaper that’s completely yours in the new Theme Studio.',
  },
  {
    id: 'colors',
    Art: ColorsArt,
    title: 'Your own colors',
    body: 'Pick one color and get a full matching theme, light or dark. Or fine-tune every color yourself.',
  },
  {
    id: 'photo',
    Art: PhotoArt,
    title: 'Photo backgrounds',
    body: 'Use any photo from your phone, with blur and frosted glass behind your timetable. Your photo never leaves your phone.',
  },
  {
    id: 'style',
    Art: StyleArt,
    title: 'Fonts and block styles',
    body: 'Eight fonts, three text sizes and four class block styles. Round the corners, hide the grid lines, go see-through.',
  },
  {
    id: 'stickers',
    Art: StickerArtPanel,
    title: 'Stickers and sticky notes',
    body: '40 stickers and handwritten notes for exam dates or a dua. Drag, resize and turn them anywhere on your wallpaper.',
  },
  {
    id: 'share',
    Art: ShareArt,
    title: 'Share with friends',
    body: 'Send your theme as a link. Friends open it and add it to their own timetable in one tap.',
  },
  { id: 'more', title: 'Also new since launch' },
];

// The 2.0 tour: swipeable cards, shown once to every visitor. `onOpenStudio` opens the
// Theme Studio from the last card (null when no slip is uploaded yet).
export default function WhatsNew({ onClose, onOpenStudio }) {
  const dialogRef = useRef(null);
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const last = CARDS.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    // Focus the dialog itself rather than its first button, which would show a focus ring.
    dialog?.focus();
    // The cards show fonts, so load the ones they use.
    ['poppins', 'playfair', 'caveat'].forEach(loadFont);
  }, []);

  const goTo = (i) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(last, i));
    track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    setIndex(next);
  };

  // Swiping scrolls the track; keep the dots in step with it.
  const onScroll = () => {
    const track = trackRef.current;
    if (track) setIndex(Math.round(track.scrollLeft / track.clientWidth));
  };

  const close = () => dialogRef.current?.close();

  const handleClose = () => {
    markAnnouncementSeen();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      tabIndex={-1}
      onClose={handleClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') goTo(index + 1);
        if (e.key === 'ArrowLeft') goTo(index - 1);
      }}
      aria-labelledby="whats-new-title"
      aria-roledescription="carousel"
      className="m-auto w-[min(26rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-line bg-surface p-0 text-ink outline-none backdrop:bg-ink/60"
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <span id="whats-new-title" className="inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold tracking-wide text-teal uppercase">
          <Sparkles className="h-4 w-4" />
          What’s new
        </span>
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="-mr-2 rounded-lg p-2 text-muted transition-colors hover:bg-teal-wash hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CARDS.map((card, i) => (
          <section
            key={card.id}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${CARDS.length}`}
            aria-hidden={i !== index}
            className="w-full shrink-0 snap-center px-5 pt-3 pb-1"
          >
            {card.Art ? (
              <>
                <card.Art />
                <h2 className={`mt-4 font-semibold text-ink ${i === 0 ? 'font-kufi text-[1.5rem] leading-tight' : 'text-[1.125rem]'}`}>
                  {card.title}
                </h2>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted">{card.body}</p>
              </>
            ) : (
              <>
                <h2 className="text-[1.125rem] font-semibold text-ink">{card.title}</h2>
                <ul className="mt-3 space-y-2">
                  {ANNOUNCEMENT.alsoNew.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[0.875rem] leading-snug text-ink">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-wash text-teal">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-5">
        <div className="flex gap-1.5" role="tablist" aria-label="Choose a card">
          {CARDS.map((card, i) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Card ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${i === index ? 'w-5 bg-teal' : 'w-2 bg-line hover:bg-muted/50'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          {index > 0 && (
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous"
              className="rounded-lg p-2.5 text-muted transition-colors hover:bg-teal-wash hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {index < last ? (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-limestone transition-colors hover:bg-teal-deep"
            >
              {index === 0 ? 'Show me' : 'Next'}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                close();
                onOpenStudio?.();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-limestone transition-colors hover:bg-teal-deep"
            >
              {onOpenStudio ? 'Open the Theme Studio' : 'Start with your slip'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}

import { useEffect } from 'react';
import {
  BookOpen, Bookmark, Bird, Camera, Cat, Cherry, Citrus, Cloud, Clover, Coffee, Crown, Feather, Flower, Flower2,
  Gem, Gift, GraduationCap, Headphones, Heart, IceCreamCone, Laptop, Leaf, Lightbulb, Moon, Music, Pencil, Plane,
  Rainbow, Rocket, Shell, Smile, Snowflake, Sparkle, Sprout, Star, Sun, Trophy, Umbrella, Zap,
} from 'lucide-react';
import Khatam from '../components/Khatam';
import { mix } from '../utils/theme';
import { FONTS, loadFont } from './styleModel';

const ICONS = {
  star: Star, heart: Heart, sparkle: Sparkle, moon: Moon, sun: Sun, cloud: Cloud, rainbow: Rainbow,
  flower: Flower, flower2: Flower2, leaf: Leaf, sprout: Sprout, clover: Clover, cherry: Cherry, citrus: Citrus,
  coffee: Coffee, icecream: IceCreamCone, book: BookOpen, bookmark: Bookmark, pencil: Pencil,
  graduation: GraduationCap, lightbulb: Lightbulb, laptop: Laptop, headphones: Headphones, music: Music,
  camera: Camera, plane: Plane, rocket: Rocket, gift: Gift, crown: Crown, trophy: Trophy, gem: Gem, smile: Smile,
  cat: Cat, bird: Bird, feather: Feather, shell: Shell, snowflake: Snowflake, umbrella: Umbrella, zap: Zap,
};

const layerStyle = { position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' };

// A sticker: the icon in two tones (a pale fill under a colored outline) over a white
// die-cut edge, all plain SVG so the saved image matches the preview everywhere.
export function StickerArt({ icon, color }) {
  const white = /^#f{6}$/i.test(color);
  const line = white ? '#334155' : color;
  const fill = white ? '#ffffff' : mix(color, '#ffffff', 0.38);
  if (icon === 'khatam') {
    return (
      <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
        <Khatam size="100%" color="#ffffff" fill="#ffffff" strokeWidth={22} style={layerStyle} />
        <Khatam size="100%" color={line} fill={fill} strokeWidth={8} style={layerStyle} />
      </span>
    );
  }
  const Icon = ICONS[icon] || Star;
  return (
    <span style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}>
      <Icon size="100%" color="#ffffff" fill="#ffffff" strokeWidth={6.5} style={layerStyle} />
      <Icon size="100%" color={line} fill={fill} strokeWidth={2.1} style={layerStyle} />
    </span>
  );
}

// A short handwritten note on colored paper with a strip of tape.
function Note({ text, color, width }) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        minHeight: width * 0.55,
        padding: `${width * 0.1}px ${width * 0.09}px ${width * 0.08}px`,
        background: color,
        color: '#2a2a2a',
        fontFamily: FONTS.caveat.family,
        fontSize: width * 0.115,
        fontWeight: 600,
        lineHeight: 1.12,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        borderRadius: width * 0.02,
        boxShadow: `0 ${width * 0.03}px ${width * 0.07}px -${width * 0.03}px rgba(0,0,0,0.4)`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -width * 0.04,
          left: '50%',
          width: width * 0.32,
          height: width * 0.09,
          transform: 'translateX(-50%) rotate(-2deg)',
          background: 'rgba(255,255,255,0.55)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.04)',
        }}
      />
      {text}
    </div>
  );
}

// One decoration, placed by its center on a wallpaper of the given CSS size. Extra
// props (event handlers) and children are for the studio's editing overlay.
export function DecorItem({ item, theme, width, height, style, children, ...rest }) {
  const itemWidth = item.size * width;
  return (
    <div
      style={{
        position: 'absolute',
        left: item.x * width,
        top: item.y * height,
        width: itemWidth,
        height: item.kind === 'sticker' ? itemWidth : 'auto',
        transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
        ...style,
      }}
      {...rest}
    >
      {item.kind === 'sticker' ? (
        <StickerArt icon={item.icon} color={item.color === 'theme' ? theme.accent : item.color} />
      ) : (
        <Note text={item.text} color={item.color} width={itemWidth} />
      )}
      {children}
    </div>
  );
}

// The decorations on one layer: 'back' (behind the timetable) or 'front' (on top).
export function DecorLayer({ items, layer, theme, width, height }) {
  const hasNote = items.some((i) => i.kind === 'note');
  useEffect(() => {
    if (hasNote) loadFont('caveat');
  }, [hasNote]);
  return items
    .filter((i) => i.layer === layer)
    .map((item) => <DecorItem key={item.id} item={item} theme={theme} width={width} height={height} />);
}

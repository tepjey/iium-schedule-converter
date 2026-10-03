import { useRef } from 'react';
import { DecorItem } from './Decor';

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// The studio's editing layer, laid over the scaled wallpaper preview. Each decoration
// gets an invisible copy (the real one is drawn by the wallpaper underneath) whose
// visible frame takes the touches: drag the frame to move, drag the round handle to
// resize and turn. `scale` is how much the preview is shrunk on screen.
export default function DecorEditor({ items, theme, width, height, scale, selectedId, onSelect, onChange }) {
  const rootRef = useRef(null);
  const gesture = useRef(null);

  // A pointer position in wallpaper CSS pixels.
  const toWallpaper = (event) => {
    const rect = rootRef.current.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale };
  };

  const startMove = (event, item) => {
    event.stopPropagation();
    onSelect(item.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { kind: 'move', id: item.id, start: toWallpaper(event), x: item.x, y: item.y };
  };

  const startTransform = (event, item) => {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = toWallpaper(event);
    const center = { x: item.x * width, y: item.y * height };
    gesture.current = {
      kind: 'transform',
      id: item.id,
      center,
      distance: Math.max(1, Math.hypot(p.x - center.x, p.y - center.y)),
      angle: Math.atan2(p.y - center.y, p.x - center.x),
      size: item.size,
      rotate: item.rotate,
      minSize: item.kind === 'note' ? 0.2 : 0.05,
    };
  };

  const onPointerMove = (event) => {
    const g = gesture.current;
    if (!g) return;
    const p = toWallpaper(event);
    if (g.kind === 'move') {
      onChange(g.id, {
        x: clamp(g.x + (p.x - g.start.x) / width, 0, 1),
        y: clamp(g.y + (p.y - g.start.y) / height, 0, 1),
      });
    } else {
      const distance = Math.hypot(p.x - g.center.x, p.y - g.center.y);
      const angle = Math.atan2(p.y - g.center.y, p.x - g.center.x);
      let rotate = g.rotate + ((angle - g.angle) * 180) / Math.PI;
      rotate = ((((rotate + 180) % 360) + 360) % 360) - 180;
      onChange(g.id, { size: clamp((g.size * distance) / g.distance, g.minSize, 0.8), rotate: Math.round(rotate) });
    }
  };

  const endGesture = () => {
    gesture.current = null;
  };

  // Handles stay the same size on screen however small the preview is.
  const handle = 22 / scale;

  return (
    <div
      ref={rootRef}
      onPointerDown={(e) => {
        if (e.target === rootRef.current) onSelect(null);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      style={{ position: 'absolute', inset: 0, width, height }}
    >
      {items.map((item) => {
        const selected = item.id === selectedId;
        return (
          <DecorItem
            key={item.id}
            item={item}
            theme={theme}
            width={width}
            height={height}
            style={{ visibility: 'hidden', zIndex: selected ? 2 : 1 }}
          >
            {/* The frame is visible (and touchable) while its decoration copy is hidden. */}
            <div
              role="button"
              aria-label={item.kind === 'note' ? 'Sticky note' : `${item.icon} sticker`}
              aria-pressed={selected}
              onPointerDown={(e) => startMove(e, item)}
              style={{
                visibility: 'visible',
                position: 'absolute',
                inset: -3 / scale,
                cursor: 'move',
                touchAction: 'none',
                border: selected ? `${1.5 / scale}px dashed #0f6b66` : 'none',
                borderRadius: 4 / scale,
                background: selected ? 'rgba(15,107,102,0.06)' : 'transparent',
              }}
            >
              {selected && (
                <div
                  role="button"
                  aria-label="Resize and turn"
                  onPointerDown={(e) => startTransform(e, item)}
                  style={{
                    position: 'absolute',
                    // Just outside the corner, so it doesn't cover a small sticker.
                    right: -handle * 0.8,
                    bottom: -handle * 0.8,
                    width: handle,
                    height: handle,
                    borderRadius: '50%',
                    background: '#0f6b66',
                    border: `${2 / scale}px solid #ffffff`,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                    cursor: 'nwse-resize',
                    touchAction: 'none',
                  }}
                />
              )}
            </div>
          </DecorItem>
        );
      })}
    </div>
  );
}

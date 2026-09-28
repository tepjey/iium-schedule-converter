// The eight-pointed star (khatam) found across IIUM's architecture: two squares,
// one turned 45°. Drawn as an outline so it can sit quietly behind other content.
export default function Khatam({ size = 24, color = 'currentColor', strokeWidth = 4, fill = 'none', className, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <g fill={fill} stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round">
        <rect x="-33" y="-33" width="66" height="66" />
        <rect x="-33" y="-33" width="66" height="66" transform="rotate(45)" />
      </g>
    </svg>
  );
}

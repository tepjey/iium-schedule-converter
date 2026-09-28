import { toCanvas } from 'html-to-image';

// html-to-image renders through the browser itself (SVG foreignObject), so it handles
// modern CSS such as Tailwind v4's oklch() colors that html2canvas cannot parse.
export const exportToImage = async (
  elementRef,
  { filename = 'IIUM_Timetable.png', pixelRatio = 3, backgroundColor, outputWidth, outputHeight } = {}
) => {
  const node = elementRef.current;
  if (!node) return;

  // Wait for fonts to load before capturing
  await document.fonts.ready;

  let canvas = await toCanvas(node, {
    pixelRatio,
    backgroundColor,
    cacheBust: true,
  });

  // Some phone sizes don't divide evenly by the pixel ratio (1220 / 3), so the render
  // can land a pixel off. Fit it to the exact size so the wallpaper matches the screen.
  if (outputWidth && outputHeight && (canvas.width !== outputWidth || canvas.height !== outputHeight)) {
    const exact = document.createElement('canvas');
    exact.width = outputWidth;
    exact.height = outputHeight;
    exact.getContext('2d').drawImage(canvas, 0, 0, outputWidth, outputHeight);
    canvas = exact;
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

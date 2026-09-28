import { toPng } from 'html-to-image';

// html-to-image renders through the browser itself (SVG foreignObject), so it handles
// modern CSS such as Tailwind v4's oklch() colors that html2canvas cannot parse.
export const exportToImage = async (elementRef, { filename = 'IIUM_Timetable.png', pixelRatio = 3, backgroundColor } = {}) => {
  const node = elementRef.current;
  if (!node) return;

  // Wait for fonts to load before capturing
  await document.fonts.ready;

  const dataUrl = await toPng(node, {
    pixelRatio,
    backgroundColor,
    cacheBust: true,
  });

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

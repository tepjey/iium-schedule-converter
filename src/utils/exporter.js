import { toCanvas } from 'html-to-image';

// Safari (and every iOS browser, which all run WebKit) often leaves fonts and images
// out of the first capture, so it gets a throwaway render first.
const isWebKit = () => /AppleWebKit/.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|Android/.test(navigator.userAgent);

// Phones and tablets, where saving goes through the share sheet or a long-press.
export const isTouchDevice = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

// Instagram, TikTok, Facebook and similar apps open links in their own browser, which
// ignores downloads and often the share sheet too.
export const isInAppBrowser = () =>
  /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Line\/|Twitter|Snapchat|Telegram|; wv\)/i.test(
    navigator.userAgent
  );

// html-to-image renders through the browser itself (SVG foreignObject), so it handles
// modern CSS such as Tailwind v4's oklch() colors that html2canvas cannot parse.
export const renderImage = async (
  elementRef,
  { filename = 'IIUM_Timetable.png', pixelRatio = 3, backgroundColor, outputWidth, outputHeight } = {}
) => {
  const node = elementRef.current;
  if (!node) throw new Error('Nothing to save yet');

  // Wait for fonts to load before capturing
  await document.fonts.ready;

  const options = { pixelRatio, backgroundColor, cacheBust: true };
  if (isWebKit()) await toCanvas(node, options);
  let canvas = await toCanvas(node, options);

  // Some phone sizes don't divide evenly by the pixel ratio (1220 / 3), so the render
  // can land a pixel off. Fit it to the exact size so the wallpaper matches the screen.
  if (outputWidth && outputHeight && (canvas.width !== outputWidth || canvas.height !== outputHeight)) {
    const exact = document.createElement('canvas');
    exact.width = outputWidth;
    exact.height = outputHeight;
    exact.getContext('2d').drawImage(canvas, 0, 0, outputWidth, outputHeight);
    canvas = exact;
  }

  // A Blob rather than a data URL: multi-megabyte data URLs silently fail to download
  // on iOS Safari and some Android browsers.
  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The image was too large to create'))), 'image/png')
  );
  return new File([blob], filename, { type: 'image/png' });
};

// Opens the share sheet with the image (iOS offers "Save Image" to Photos).
// Returns 'shared', 'cancelled', or 'unavailable' when the browser won't allow it,
// e.g. because too much time passed since the tap while the image was rendering.
export const shareImage = async (file) => {
  if (!navigator.canShare?.({ files: [file] })) return 'unavailable';
  try {
    await navigator.share({ files: [file] });
    return 'shared';
  } catch (err) {
    return err?.name === 'AbortError' ? 'cancelled' : 'unavailable';
  }
};

export const downloadImage = (file) => {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

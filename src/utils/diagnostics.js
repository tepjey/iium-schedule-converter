// Technical details for problem reports: the browser and where in the site's code the
// last error happened. Nothing from the slip is included, so this is safe to share
// publicly on GitHub.

let lastError = null;

export const recordError = (error) => {
  if (error) lastError = error;
};

// Errors that escape the app's own handling are worth reporting too.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => recordError(event.error));
  window.addEventListener('unhandledrejection', (event) => recordError(event.reason));
}

// "fn@https://tepjey.github.io/iium-schedule-converter/assets/pdf-Ab12.js:3:4567"
// becomes "fn@pdf-Ab12.js:3:4567". The file name's hash identifies the deployed build.
const shortenStack = (stack) =>
  String(stack)
    .split('\n')
    .map((line) => line.trim().replace(/(?:https?|blob):\/\/[^\s)]*\/([^/\s)?#]+)(?:[?#][^\s):]*)?/g, '$1'))
    .filter(Boolean)
    .slice(0, 6)
    .map((line) => line.slice(0, 120))
    .join('\n');

export const technicalDetails = () => {
  const lines = [`Browser: ${navigator.userAgent}`];
  if (lastError) {
    const name = lastError.name || 'Error';
    const message = String(lastError.message || lastError).slice(0, 200);
    lines.push(`Error: ${name}: ${message}`);
    // Chrome's stack starts with the message again; Safari's doesn't.
    if (lastError.stack) lines.push(shortenStack(String(lastError.stack).replace(`${name}: ${message}\n`, '')));
  }
  return lines.join('\n');
};

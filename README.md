<div align="center">

# SlipSnap

**Turn your IIUM confirmation slip into a weekly timetable and phone wallpaper.**

*Formerly IIUM Schedule Converter.*

[![Open SlipSnap](https://img.shields.io/badge/Open_SlipSnap-0f6b66?style=for-the-badge)](https://slipsnap.pages.dev/)

[![Deploy](https://github.com/tepjey/iium-schedule-converter/actions/workflows/deploy.yml/badge.svg)](https://github.com/tepjey/iium-schedule-converter/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-0f6b66.svg)](LICENSE)
[![Made with React](https://img.shields.io/badge/React-19-0f6b66?logo=react&logoColor=white)](https://react.dev)
[![Support on Ko-fi](https://img.shields.io/badge/Support_on_Ko--fi-c9a46a?logo=kofi&logoColor=white)](https://ko-fi.com/athifuzair)

<img src="public/og-image.png" alt="SlipSnap: an IIUM confirmation slip turned into a weekly timetable on a phone lock screen" width="720" />

</div>

SlipSnap (formerly IIUM Schedule Converter, also called IIUM Timetable) reads the IIUM Course Registration Confirmation Slip you download from i-Ma'luum and lays your classes out as a weekly schedule. You can recolor each course and save it as a timetable image or as a lock screen wallpaper sized for your phone or iPad.

> [!NOTE]
> This is an unofficial student project and is not affiliated with the International Islamic University Malaysia (IIUM).

## Contents

- [Features](#features)
- [How to use](#how-to-use)
- [Privacy](#privacy)
- [Reporting a problem](#reporting-a-problem)
- [Running it locally](#running-it-locally)
- [How the slip is read](#how-the-slip-is-read)
- [Contributing](#contributing)
- [Supporting the project](#supporting-the-project)
- [License](#license)

## Features

- **Wallpaper or timetable.** Save a lock screen wallpaper that keeps the top of the screen clear for the clock, or a wide timetable image for sharing and printing.
- **Sized for your device.** Presets for iPhones from the SE to the 17 Pro Max, popular Android phones (Samsung Galaxy, Xiaomi, Redmi and more) and iPads in portrait or landscape. On a phone, *Match this device* sizes it to your screen.
- **Themes.** Three light themes (Limestone, Sakura, Mint) and three dark ones (Midnight, AMOLED, Ocean), with a 12-hour or 24-hour clock and a choice of fonts.
- **Your colors.** Tap any course to give it a color from the palette.
- **Private.** Your slip is read on your device and never uploaded.
- **Works on phones.** Saving uses the share sheet on iPhone and Android, with a fallback for Instagram, TikTok and other in-app browsers.

## How to use

1. Log in to **i-Ma'luum**. On the home page, find **Favourite Links**.
2. Select **Confirmation Slip**, then **Print**, and save it as a PDF.
3. Open **[SlipSnap](https://slipsnap.pages.dev/)** and upload that PDF.
4. Pick a layout, theme and colors, then tap **Save**.

On iPhone, choose **Save Image** in the share sheet to put the wallpaper in Photos. Then open **Settings → Wallpaper** to set it.

## Privacy

- **Your slip stays on your device.** The PDF is read in your browser with [pdf.js](https://github.com/mozilla/pdf.js). Nothing from it, including your name, matric number and IC number, is sent to any server.
- **Preferences stay in your browser.** Theme, layout and time format are saved in your browser's local storage.
- **Anonymous visit counting.** [GoatCounter](https://www.goatcounter.com) counts visits without cookies or cross-site tracking. It also counts a few actions by name only (slip read, slip failed, image saved). When a slip can't be read, the type of problem (for example "no courses found") is counted, without any slip content.

## Reporting a problem

If your timetable comes out wrong or an image won't save, the website links to a [problem report form](https://github.com/tepjey/iium-schedule-converter/issues/new?template=report-a-problem.yml) with the error already filled in. Nothing is sent unless you submit the form yourself.

> [!IMPORTANT]
> Please **don't attach your confirmation slip**. It shows your IC and matric number, and issues are public. Typing out the affected row is enough.

For security problems, see the [security policy](.github/SECURITY.md).

## Running it locally

Requires [Node.js](https://nodejs.org) 22 or newer.

```bash
git clone https://github.com/tepjey/iium-schedule-converter.git
cd iium-schedule-converter
npm ci
npm run dev
```

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload   |
| `npm run lint`    | Check the code with ESLint             |
| `npm run build`   | Build the production site into `dist/` |
| `npm run preview` | Serve the production build locally     |

Every push to `main` is linted, built and deployed to GitHub Pages by [this workflow](.github/workflows/deploy.yml).

## How the slip is read

The parser lives in [`src/utils/parser.js`](src/utils/parser.js).

1. **Rebuilding lines.** pdf.js returns text in arbitrary chunks, so the pieces are regrouped into visual lines by their position on the page.
2. **Course rows.** A row such as `BICS 2301 3 R Enterprise Networks 3 T-TH 11.30 - 12.50 PM ICT CISCO LAB LEVEL 4C` gives the code, section, status, title, credit hours, days, time and venue.
3. **Extra slots.** A line that starts with a day and time (for example `MON 2.00 - 3.30 PM`) is another class for the course above it.
4. **AM and PM.** The slip prints one AM/PM for the whole range, and it applies to the end time. So `11.30 - 12.50 PM` means 11:30 AM to 12:50 PM.
5. **iOS Safari.** Text is read with a stream reader rather than `getTextContent()`, which fails on iOS Safari.

## Contributing

Reports of slips that don't read correctly are the most helpful contribution, and no code is needed. To work on the code, read the [contributing guide](.github/CONTRIBUTING.md) first. Everyone taking part is expected to follow the [code of conduct](.github/CODE_OF_CONDUCT.md).

## Supporting the project

SlipSnap is free for every IIUM student, and it always will be. If it saved you time and you'd like to say thanks, you can [buy me a coffee on Ko-fi](https://ko-fi.com/athifuzair). It's completely optional; telling a friend about the site or reporting a slip that didn't read correctly helps just as much.

## Built with

[React](https://react.dev), [Vite](https://vite.dev), [Tailwind CSS](https://tailwindcss.com), [pdf.js](https://github.com/mozilla/pdf.js), [html-to-image](https://github.com/bubkoo/html-to-image), [Lucide](https://lucide.dev) icons, and the Plus Jakarta Sans and Reem Kufi typefaces (SIL Open Font License).

## License

[MIT](LICENSE) © 2026 [tepjey](https://github.com/tepjey)

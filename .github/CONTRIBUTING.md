# Contributing to SlipSnap

Thanks for helping! Most of the value in this project comes from students reporting slips that don't read correctly, so you don't need to write code to contribute.

By taking part, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

### Report a slip that doesn't read correctly

[Open a problem report](https://github.com/tepjey/iium-schedule-converter/issues/new?template=report-a-problem.yml). The form asks for:

- the course code that went wrong,
- the **Day, Time and Venue exactly as printed on your slip** (this is the most useful part), and
- what the website showed instead.

> [!IMPORTANT]
> **Never attach your confirmation slip.** It shows your name, matric number and IC number, and issues here are public. Typing out the affected row is enough.

### Suggest an improvement

Open a [blank issue](https://github.com/tepjey/iium-schedule-converter/issues/new) describing what you'd like and why. For larger changes, please open an issue before writing code so we can agree on the approach first.

### Fix something

Issues labeled `bug` are a good place to start. Comment on the issue to say you're working on it.

## Development setup

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
git clone https://github.com/tepjey/iium-schedule-converter.git
cd iium-schedule-converter
npm ci
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Start the dev server with hot reload        |
| `npm run lint`    | Check the code with ESLint                  |
| `npm run build`   | Build the production site into `dist/`      |
| `npm run preview` | Serve the production build locally          |

### Testing without a real slip

Don't commit real slips, and don't use someone else's. To test the parser, make a fake slip: write the rows in a document, for example

```text
Session : 2026/2027 Semester : 1
BICS 2301 3 R Enterprise Networks 3 T-TH 11.30 - 12.50 PM ICT CISCO LAB
MATH 1310 2 R Calculus 3 M-W 9.00 - 10.20 AM ICT LR 5
```

and print it to PDF. Keep test PDFs out of the repository.

## Project structure

```text
src/
├── App.jsx                 Page layout, export flow and state
├── config.js               GitHub username, GoatCounter code, issue link
├── components/
│   ├── PDFUploader.jsx     Upload box and error messages
│   ├── ControlPanel.jsx    Layout, theme, font and color controls
│   ├── Timetable.jsx       Weekly grid (timetable layout)
│   ├── WallpaperView.jsx   Phone and tablet wallpaper layout
│   ├── SavePreview.jsx     Save dialog shown on phones when sharing fails
│   └── Faq.jsx             Questions under the upload box
└── utils/
    ├── parser.js           Reads the slip PDF into courses and time slots
    ├── exporter.js         Renders the image and saves or shares it
    ├── theme.js            Themes, course colors and wallpaper sizes
    └── analytics.js        Privacy-friendly visit and event counting
```

## Guidelines

- **Privacy first.** Slip contents must never leave the device. Don't add network requests, trackers or third-party scripts that could see slip data.
- **Test on a phone.** Most students use the site on iPhones and Android phones, often inside Instagram or WhatsApp's built-in browser. Changes to saving or the wallpaper should be tried on mobile Safari at least.
- **Match the surrounding code.** Follow the existing naming and structure. Comments explain *why*, not *what*.
- **Keep it small.** One change per pull request is easier to review and to revert.
- **Lint and build must pass.** GitHub Actions runs both before deploying.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your change, then run `npm run lint` and `npm run build`.
3. Open a pull request and fill in the template, including how you tested it.

Merges to `main` deploy to the live site automatically through GitHub Pages.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](../LICENSE).

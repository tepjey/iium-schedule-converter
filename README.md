# IIUM Timetable

Turn your IIUM Course Registration Confirmation Slip into a weekly timetable you can recolor and save as an image or a phone wallpaper.

An unofficial student project, not affiliated with IIUM.

## How to use

1. Log in to i-Ma'luum. On the home page, find **Favourite Links**.
2. Select **Confirmation Slip**, then **Print**, and save it as a PDF.
3. Open the site and upload that PDF.

Then pick a layout (timetable or phone wallpaper), a light or dark theme, 12h or 24h time, and course colors, and save the image.

## Privacy

The PDF is read entirely in your browser with pdf.js. Nothing from your slip is uploaded to a server. Display preferences (theme, layout, time format) are stored in your browser's local storage.

Visits are counted anonymously with [GoatCounter](https://www.goatcounter.com), which uses no cookies and doesn't track you across sites. It also counts a few actions (slip read, slip failed, image saved) by name only. When a slip can't be read, the type of problem (for example "no courses found") is counted too, without any slip content.

If a slip can't be read or an image won't save, the site links to a [GitHub issue form](https://github.com/tepjey/iium-schedule-converter/issues/new?template=report-a-problem.yml) with the error already filled in. Nothing is sent unless you submit that form yourself, and you can edit it first.

## How parsing works

`src/utils/parser.js` does the work:

- pdf.js text comes in arbitrary chunks, so items are regrouped into visual lines by their position on the page, then matched with regular expressions.
- A course row looks like `BICS 2301 3 R Enterprise Networks 3 T-TH 11.30 - 12.50 PM ICT CISCO LAB LEVEL 4C`. Lines that start with a day and time (e.g. `MON 2.00 - 3.30 PM`) are extra slots for the course above.
- The slip prints one AM/PM for the whole range, which applies to the end time, so `11.30 - 12.50 PM` is 11:30 AM to 12:50 PM.
- Text is read with a stream reader rather than `getTextContent()`, which fails on iOS Safari.

If your slip doesn't parse, please open an issue with the layout details. Don't attach the PDF itself, since it contains your matric and IC numbers.

## Built with

React, Vite, Tailwind CSS, [pdf.js](https://github.com/mozilla/pdf.js), [html-to-image](https://github.com/bubkoo/html-to-image), [Lucide](https://lucide.dev) icons, and the Plus Jakarta Sans and Reem Kufi typefaces (SIL Open Font License).

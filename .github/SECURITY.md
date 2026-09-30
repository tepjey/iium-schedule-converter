# Security Policy

## Supported versions

Only the live site at [tepjey.github.io/iium-schedule-converter](https://tepjey.github.io/iium-schedule-converter/), built from the `main` branch, is supported. Fixes are deployed there, not backported.

## What's in scope

IIUM Schedule Converter runs entirely in the browser. There is no server, database or account system, and a student's confirmation slip is never uploaded. The most important security property is that **slip contents (name, matric number, IC number, courses) never leave the student's device**.

Reports we especially want to hear about:

- Any way slip contents could be sent off the device, stored, or exposed to another site
- Cross-site scripting, for example through text in a crafted PDF
- Ways around the site's Content Security Policy
- A vulnerable dependency that is actually reachable from the site

Out of scope: problems in GitHub Pages itself, missing HTTP headers that GitHub Pages doesn't allow sites to set, and issues that need a compromised device or browser.

## Reporting a vulnerability

**Please don't open a public issue for security problems.**

Report it privately through GitHub instead:

1. Go to the [Security tab](https://github.com/tepjey/iium-schedule-converter/security) of this repository.
2. Click **Report a vulnerability** ([direct link](https://github.com/tepjey/iium-schedule-converter/security/advisories/new)).
3. Describe the problem, how to reproduce it, and what an attacker could do with it.

Don't include a real confirmation slip. If a PDF is needed to reproduce the problem, make one with fake details.

This is a one-person student project, so replies are best-effort. You can expect an acknowledgement within a week. Once the problem is fixed, you'll be credited in the advisory unless you'd prefer not to be.

# Year Reflection

A reflection app for yearly goals and weekly check-ins. Set your intentions at the start of the year, then reflect on your progress every week.

## Try It Now

- **Web version:** [year-reflection.vercel.app](https://year-reflection.vercel.app) _(live demo)_
- **Desktop app:** [Download from Releases](https://github.com/kristina8wong/reflection-site/releases) _(native app)_

Yay!

## Features

- **Goals** — Define your goals for the year with titles and descriptions
- **Weekly Check-in** — Each week, reflect on each goal with a 1–5 progress rating and written reflection
- **Year View** — See your check-in history across all 52 weeks

## Getting Started

### For Development

**Prerequisites:**
- [Node.js](https://nodejs.org/) v18+ (check: `node -v`)
- npm v9+ (check: `npm -v`)

**Install & Run:**

```bash
# Install dependencies (use ci for reproducible builds)
npm ci

# Start the app in development mode
npm run dev
```

This starts the Vite dev server and launches the Electron app.

**Troubleshooting install issues?** Run:
```bash
npm run reinstall:clean
```

### Build Desktop App

```bash
npm run build
```

The packaged app will be in the `release/` directory (Mac: `.app`, Windows: `.exe`).

## Tech Stack

- **Electron** — Desktop app shell
- **React** — UI
- **Vite** — Build tooling
- **TypeScript** — Type safety
- **date-fns** — Date utilities
- **localStorage** — Data persistence (stored locally on your machine)

## Data Storage

All data is stored locally in your browser's localStorage. Your goals and reflections never leave your computer.

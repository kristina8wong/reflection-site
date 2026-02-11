# Year Reflection

A desktop app for yearly goals and weekly check-ins. Set your intentions at the start of the year, then reflect on your progress every week.

## Features

- **Goals** — Define your goals for the year with titles and descriptions
- **Weekly Check-in** — Each week, reflect on each goal with a 1–5 progress rating and written reflection
- **Year View** — See your check-in history across all 52 weeks

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Install & Run

```bash
npm install
npm run dev
```

This starts the Vite dev server and launches the Electron app.

### Build for Distribution

```bash
npm run build
```

The packaged app will be in the `release/` directory.

## Tech Stack

- **Electron** — Desktop app shell
- **React** — UI
- **Vite** — Build tooling
- **TypeScript** — Type safety
- **date-fns** — Date utilities
- **localStorage** — Data persistence (stored locally on your machine)

## Data Storage

All data is stored locally in your browser's localStorage. Your goals and reflections never leave your computer.

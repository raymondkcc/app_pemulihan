# App Pemulihan

The first module is available at `/kvk` as **Bijak KVK: Pintu Bacaan Interaktif**.

The interface uses a readable Arial/Helvetica-style sans-serif. The game also has a native fullscreen button; its in-app exit button asks a two-digit addition or subtraction question before leaving fullscreen. Browser-level Escape remains controlled by the browser itself.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/kvk`.

## Build for Vercel

```bash
npm run build
```

The Vercel rewrite keeps the `/kvk` route working on a direct visit. This module is fully client-side and does not require Firebase: scores are session-only and there is no login, database, file upload, or shared progress yet.

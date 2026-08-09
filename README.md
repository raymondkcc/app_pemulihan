# App Pemulihan

The first module is available at `/kvk` as **Bijak KVK: Pintu Bacaan Interaktif**.

The learning-space home page is available at `/`. Its Mathematics section includes the addition regrouping activity at `/addition-regroup` and subtraction regrouping activity at `/minus-regroup`.

The interface uses Comic Sans MS with Comic Neue and Arial fallbacks so the lowercase `a` keeps the familiar single-storey shape even when the local font is unavailable. The game also has a native fullscreen button; its in-app exit button asks a two-digit addition or subtraction question before leaving fullscreen. Browser-level Escape remains controlled by the browser itself.

If a tablet gesture exits native fullscreen, the app detects that unexpected exit and shows the same maths gate before the game can continue. This cannot prevent the operating system from switching apps or leaving the browser; kiosk mode, Android screen pinning, iPad Guided Access, or a managed single-app device is required for that level of lockdown.

Each ending category tracks correct answers, wrong answers, and accuracy for the current session. Random practice weights categories toward higher error rates and categories that have not been practised yet. The `Mula!` action starts the session and stays hidden until the session is reset.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/` for the learning-space picker, `http://localhost:5173/kvk` for the KVK module, or use `/addition-regroup` and `/minus-regroup` for the mathematics regrouping activities.

## Build for Vercel

```bash
npm run build
```

The Vercel rewrite keeps the `/`, `/kvk`, `/addition-regroup`, and `/minus-regroup` routes working on direct visits. These modules are fully client-side and do not require Firebase: scores are session-only and there is no login, database, file upload, or shared progress yet.

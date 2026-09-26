# AGENTS.md — Pemulihan LearningApp

## Project overview

- Firebase project: `kembara-pintar`
- Firebase configuration files:
  - `.firebaserc` — selected Firebase project
  - `firebase.json` — deployment configuration
  - `firestore.rules` — Firestore security rules
- The application is a Vite/React app. Run commands from the project root:
  `C:\Users\User\Documents\Pemulihan LearningApp`

## Firebase operations

- Before any Firebase operation, verify the target project is `kembara-pintar` and confirm the requested scope (rules, hosting, functions, data, or authentication).
- Prefer deploying only the requested resource. For Firestore rules:
  `firebase deploy --only firestore:rules --project kembara-pintar`
- If the Firebase CLI is unavailable, use `npx firebase-tools` rather than modifying project dependencies solely for deployment.
- A service-account key may be available locally at:
  `C:\Users\User\Downloads\kembara-pintar-firebase-adminsdk-fbsvc-f72b2b71ed.json`
- Use the key only through a process environment variable such as `GOOGLE_APPLICATION_CREDENTIALS`. Never print, quote, expose, commit, or copy the key contents into source files, prompts, logs, or generated artifacts.
- Never deploy to a different Firebase project without explicit user confirmation.
- After deployment, report whether the change was only made locally or successfully released to Firebase, including the exact project and resource. Do not claim deployment succeeded based only on a local file change.
- Before changing production rules, inspect the current local diff and preserve existing access behavior unless the user explicitly requests a security-policy change.
- For rules changes, run a build or rules validation when practical, then deploy only after checking `git diff --check`.

## Application-specific conventions

- Newly generated class codes use exactly 2 uppercase letters followed by 2 digits, e.g. `DT69`.
- Class-code reservations use the Firestore `classCodes` collection and must remain collision-safe.
- Existing class codes must remain usable unless a migration is explicitly requested.

## Security

- Treat Firebase service-account files, API keys, OAuth credentials, and authentication tokens as secrets.
- Do not add credentials to Git, `.env` files committed to the repository, documentation, screenshots, or chat responses.
- If a credential may have been publicly exposed, advise revocation and regeneration.

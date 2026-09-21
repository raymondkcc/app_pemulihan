import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const secondaryApp = getApps().some((app) => app.name === "Secondary")
  ? getApp("Secondary")
  : initializeApp(firebaseConfig, "Secondary");

export const auth = getAuth(firebaseApp);
export const secondaryAuth = getAuth(secondaryApp);

function createDb(app) {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    return getFirestore(app);
  }
}

export const db = createDb(firebaseApp);

export let analytics = null;

if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  isSupported()
    .then((ok) => {
      if (ok) analytics = getAnalytics(firebaseApp);
    })
    .catch(() => {});
}

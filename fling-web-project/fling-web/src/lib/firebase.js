import { initializeApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app, auth;
if (firebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };

/**
 * Sets up (or reuses) an invisible reCAPTCHA bound to the given container id.
 * Firebase phone auth requires this even though it's invisible.
 */
export function ensureRecaptcha(containerId = "recaptcha-container") {
  if (!window.__flingRecaptcha) {
    window.__flingRecaptcha = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
  }
  return window.__flingRecaptcha;
}

/**
 * Kicks off phone OTP sign-in. `phone` must be E.164 format, e.g. +919876543210.
 * Returns a Firebase ConfirmationResult — call .confirm(code) on it with the OTP.
 */
export async function startPhoneSignIn(phone) {
  const verifier = ensureRecaptcha();
  return signInWithPhoneNumber(auth, phone, verifier);
}

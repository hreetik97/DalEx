// Lazily-initialized Firebase Admin singletons.
// Importing this module in a deployed function is safe; in unit tests only
// src/lib/* is imported, so Admin is never initialized there.
import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

function getApp(): admin.app.App {
  if (!app) {
    app = admin.apps.length > 0 ? admin.app() : admin.initializeApp();
  }
  return app;
}

export const db = (): admin.firestore.Firestore => getApp().firestore();
export const messaging = (): admin.messaging.Messaging => getApp().messaging();
export const auth = (): admin.auth.Auth => getApp().auth();

// DPDP erasure: authenticated callable. Recursively deletes the entire
// users/{uid}/** subtree with a BulkWriter, then deletes the Auth user.
// Used by the in-app "Delete account" flow and the web deletion page.
import * as logger from 'firebase-functions/logger';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { BulkWriter, CollectionReference } from 'firebase-admin/firestore';
import { db, auth } from './admin';

const REGION = 'asia-south1';

async function deleteCollectionRecursive(
  writer: BulkWriter,
  collRef: CollectionReference
): Promise<void> {
  // Page through the collection; BulkWriter absorbs the write rate.
  for (;;) {
    const snap = await collRef.limit(500).get();
    if (snap.empty) break;
    await Promise.all(
      snap.docs.map(async (doc) => {
        const subcollections = await doc.ref.listCollections();
        for (const sub of subcollections) {
          await deleteCollectionRecursive(writer, sub);
        }
        writer.delete(doc.ref);
      })
    );
  }
}

export const deleteAccount = onCall({ region: REGION, maxInstances: 5 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to delete your account.');
  }
  const uid = request.auth.uid;
  const firestore = db();

  const writer = firestore.bulkWriter();
  writer.onWriteError((err) => {
    logger.error('BulkWriter error during account deletion', { uid, err });
    return false; // do not retry; surface the failure
  });

  try {
    await deleteCollectionRecursive(writer, firestore.collection(`users/${uid}`));
    // Delete the top-level user doc itself (fields like notifPrefs, fcmTokens).
    writer.delete(firestore.doc(`users/${uid}`));
    await writer.close();
  } catch (err) {
    logger.error('Account subtree deletion failed', { uid, err });
    throw new HttpsError('internal', 'Could not delete your data. Please try again.');
  }

  try {
    await auth().deleteUser(uid);
  } catch (err) {
    logger.error('Auth user deletion failed', { uid, err });
    throw new HttpsError('internal', 'Data deleted, but the sign-in record could not be removed.');
  }

  logger.info('Account deleted', { uid });
  return { ok: true };
});

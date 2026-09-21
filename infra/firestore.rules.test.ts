/**
 * Firestore security rules tests for Hisab.
 *
 * Runs against the Firestore emulator. All figures are sample data.
 *
 * The emulator host can be overridden (some sandboxed environments only
 * allow IPv6 loopback): FIRESTORE_EMULATOR_HOST=localhost
 * (`localhost` resolves to ::1 first; a bare ::1 literal is not accepted
 * by the Firestore client). A "host:port" or "[::1]:port" value is also
 * accepted — any port suffix is stripped. Note `firebase emulators:exec`
 * overwrites FIRESTORE_EMULATOR_HOST with its own value, so in such
 * sandboxes start the emulator on ::1 in one terminal (see infra/README.md)
 * and run jest in another instead of using emulators:exec.
 *
 * Local:  cd infra && npm install
 *         npm run test:emulator
 * which expands to:
 *         npx firebase emulators:exec --only firestore "npx jest firestore.rules.test.ts"
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-hisab-rules-test';
const RULES_PATH = resolve(__dirname, 'firestore.rules');
// `firebase emulators:exec` sets FIRESTORE_EMULATOR_HOST to "host:port"
// (or "[::1]:port"); the rules-unit-testing client wants a bare host,
// so strip any port suffix here.
function parseEmulatorHost(raw: string | undefined): string {
  const h = raw || '127.0.0.1';
  if (h.startsWith('[')) return h.slice(1, h.indexOf(']'));
  const first = h.indexOf(':');
  const last = h.lastIndexOf(':');
  if (first > 0 && first === last) return h.slice(0, first); // host:port
  return h; // bare host or unbracketed IPv6
}
const EMULATOR_HOST = parseEmulatorHost(process.env.FIRESTORE_EMULATOR_HOST);
const EMULATOR_PORT = Number(process.env.FIRESTORE_EMULATOR_PORT || 8080);

let testEnv: RulesTestEnvironment;

const validTxn = {
  amountPaise: 12999,
  merchantRaw: 'Swiggy',
  merchant: 'swiggy',
  category: 'food',
  method: 'upi',
  txnAt: new Date('2026-09-21T12:30:00+05:30'),
  source: 'manual',
  sourceRef: 'test',
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(RULES_PATH, 'utf8'),
      host: EMULATOR_HOST,
      port: EMULATOR_PORT,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('default-deny: unauthenticated access', () => {
  test('cannot read a user doc', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/alice')));
  });

  test('cannot write a user doc', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, 'users/alice'), { displayName: 'Alice' }));
  });

  test('cannot read or write transactions', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/alice/transactions/t1')));
    await assertFails(setDoc(doc(db, 'users/alice/transactions/t1'), validTxn));
  });

  test('cannot read plans', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/alice/plans/2026-09-21')));
  });
});

describe('owner access: users/{uid}/**', () => {
  test('owner can CRUD own user doc', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(db, 'users/alice');
    await assertSucceeds(setDoc(ref, { displayName: 'Alice' }));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { timezone: 'Asia/Kolkata' }));
    await assertSucceeds(deleteDoc(ref));
  });

  test('owner can CRUD own transactions', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(db, 'users/alice/transactions/t1');
    await assertSucceeds(setDoc(ref, validTxn));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { note: 'lunch' }));
    await assertSucceeds(deleteDoc(ref));
  });

  test('owner can write plans, digests, dailyTotals, budgets, bills', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(db, 'users/alice/plans/2026-09-21'), { items: [] }));
    await assertSucceeds(setDoc(doc(db, 'users/alice/digests/2026-09-21'), { totalPaise: 0 }));
    await assertSucceeds(setDoc(doc(db, 'users/alice/dailyTotals/2026-09-21'), { totalPaise: 0 }));
    await assertSucceeds(setDoc(doc(db, 'users/alice/budgets/food'), { monthPaise: 500000 }));
    await assertSucceeds(setDoc(doc(db, 'users/alice/bills/b1'), { name: 'Rent', amountPaise: 1500000 }));
  });
});

describe('cross-user isolation', () => {
  test('alice cannot read or write bob user doc', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(db, 'users/bob')));
    await assertFails(setDoc(doc(db, 'users/bob'), { displayName: 'Bob' }));
  });

  test('alice cannot touch bob transactions subcollection', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(db, 'users/bob/transactions/t1')));
    await assertFails(setDoc(doc(db, 'users/bob/transactions/t1'), validTxn));
    await assertFails(deleteDoc(doc(db, 'users/bob/transactions/t1')));
  });

  test('alice cannot write bob budgets', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(db, 'users/bob/budgets/food'), { monthPaise: 1 }));
  });
});

describe('transaction create validation', () => {
  const createAs = (uid: string, data: object) =>
    setDoc(doc(testEnv.authenticatedContext(uid).firestore(), `users/${uid}/transactions/t1`), data);

  test('valid transaction is accepted', async () => {
    await assertSucceeds(createAs('alice', validTxn));
  });

  test('rejects negative amountPaise', async () => {
    await assertFails(createAs('alice', { ...validTxn, amountPaise: -100 }));
  });

  test('rejects float amountPaise', async () => {
    await assertFails(createAs('alice', { ...validTxn, amountPaise: 10.5 }));
  });

  test('rejects non-integer amountPaise type', async () => {
    await assertFails(createAs('alice', { ...validTxn, amountPaise: '12999' }));
  });

  test('rejects missing amountPaise', async () => {
    const rest: Record<string, unknown> = { ...validTxn };
    delete rest.amountPaise;
    await assertFails(createAs('alice', rest));
  });

  test('allows zero amountPaise (int >= 0)', async () => {
    await assertSucceeds(createAs('alice', { ...validTxn, amountPaise: 0 }));
  });

  test('rejects method outside enum', async () => {
    await assertFails(createAs('alice', { ...validTxn, method: 'wire' }));
    await assertFails(createAs('alice', { ...validTxn, method: 'UPI' }));
  });

  test('rejects category outside taxonomy', async () => {
    await assertFails(createAs('alice', { ...validTxn, category: 'gambling' }));
  });

  test('accepts every method and category in the enums', async () => {
    const methods = ['upi', 'card', 'netbanking', 'cash'];
    const categories = ['food', 'groceries', 'transport', 'shopping', 'bills', 'health', 'entertainment', 'travel', 'education', 'other'];
    for (const method of methods) {
      for (const category of categories) {
        await testEnv.clearFirestore();
        await assertSucceeds(createAs('alice', { ...validTxn, method, category }));
      }
    }
  });
});

describe('savings goals', () => {
  const validGoal = { name: 'Emergency fund', targetPaise: 5000000, savedPaise: 0 };

  test('owner can CRUD own goals', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    const ref = doc(db, 'users/alice/goals/g1');
    await assertSucceeds(setDoc(ref, validGoal));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(updateDoc(ref, { savedPaise: 100000 }));
    await assertSucceeds(deleteDoc(ref));
  });

  test('unauthenticated cannot touch goals', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'users/alice/goals/g1')));
    await assertFails(setDoc(doc(db, 'users/alice/goals/g1'), validGoal));
  });

  test('alice cannot touch bob goals', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(getDoc(doc(db, 'users/bob/goals/g1')));
    await assertFails(setDoc(doc(db, 'users/bob/goals/g1'), validGoal));
  });

  test('rejects goal with empty name or non-positive target', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(db, 'users/alice/goals/g1'), { ...validGoal, name: '' }));
    await assertFails(setDoc(doc(db, 'users/alice/goals/g1'), { ...validGoal, targetPaise: 0 }));
    await assertFails(setDoc(doc(db, 'users/alice/goals/g1'), { ...validGoal, targetPaise: -5 }));
    await assertFails(setDoc(doc(db, 'users/alice/goals/g1'), { ...validGoal, savedPaise: -1 }));
    await assertFails(setDoc(doc(db, 'users/alice/goals/g1'), { ...validGoal, savedPaise: 10.5 }));
  });
});

// Unit tests for dead-token detection. Sample data.
import { deadTokens } from '../src/cleanupTokens';

// NOTE: importing cleanupTokens pulls in firebase-admin via ./admin, but
// admin.initializeApp() is lazy (getApp() is only called inside handlers),
// so this import is safe without credentials.
describe('deadTokens', () => {
  it('removes tokens after 3 consecutive failures', () => {
    expect(deadTokens({ t1: { failures: 3 }, t2: { failures: 2 } })).toEqual(['t1']);
  });

  it('removes permanently unregistered tokens immediately', () => {
    expect(
      deadTokens({
        t1: { failures: 1, lastFailureCode: 'messaging/registration-token-not-registered' },
        t2: { failures: 1, lastFailureCode: 'messaging/unregistered' },
        t3: { failures: 1, lastFailureCode: 'messaging/too-many-requests' },
      })
    ).toEqual(['t1', 't2']);
  });

  it('keeps healthy tokens and handles missing maps', () => {
    expect(deadTokens({ t1: { failures: 0 }, t2: {} })).toEqual([]);
    expect(deadTokens(undefined)).toEqual([]);
  });
});

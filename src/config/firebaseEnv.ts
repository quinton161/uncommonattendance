/**
 * Whether the CRA build embedded Firebase web config (REACT_APP_* set at `npm run build` time).
 * Does not import Firebase — safe to use from index.tsx before any firebase module loads.
 */
export function isFirebaseWebConfigPresent(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  const key = process.env.REACT_APP_FIREBASE_API_KEY;
  return typeof key === 'string' && key.trim() !== '';
}

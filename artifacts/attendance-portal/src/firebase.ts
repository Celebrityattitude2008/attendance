import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyAKii-aOhj46hGn9JXmDlXvU8zItQ8CZsY",
  authDomain: "attendance-portal-659d6.firebaseapp.com",
  databaseURL: "https://attendance-portal-659d6-default-rtdb.firebaseio.com",
  projectId: "attendance-portal-659d6",
  storageBucket: "attendance-portal-659d6.firebasestorage.app",
  messagingSenderId: "377133426719",
  appId: "1:377133426719:web:7231c02134968d619b8d2a"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.database();
export { firebase };

export function sanitizeEmail(matricNo: string): string {
  const normalized = matricNo.toLowerCase().trim().replace(/[^a-z0-9._-]/g, '_');
  return `${normalized}@ids111.com`;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return email?.toLowerCase() === 'pauladamu600@gmail.com';
}

export async function ensureUserRecord(
  user: firebase.User,
  role: string,
  name: string
): Promise<void> {
  const userRef = db.ref(`users/${user.uid}`);
  const snapshot = await userRef.once('value');
  if (!snapshot.exists()) {
    await userRef.set({
      matricNo: role === 'admin' ? 'admin' : user.email?.split('@')[0],
      name: name || (role === 'admin' ? 'Administrator' : 'Student'),
      email: user.email,
      role,
    });
  } else {
    const existing = snapshot.val() as Record<string, unknown>;
    if (!existing['role']) {
      await userRef.update({ role });
    }
  }
}

export async function signInWithGoogle(role: string): Promise<firebase.User> {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await firebase.auth().signInWithPopup(provider);
  await ensureUserRecord(result.user!, role, role === 'admin' ? 'Administrator' : '');
  return result.user!;
}

export async function ensureTestAccount(): Promise<firebase.User> {
  try {
    const uc = await firebase.auth().signInWithEmailAndPassword('test001@ids111.com', 'Test@123');
    await ensureUserRecord(uc.user!, 'student', 'Test Student');
    return uc.user!;
  } catch (error: unknown) {
    const e = error as { code?: string; message?: string };
    if (e.code === 'auth/user-not-found' || e.message?.includes('user-not-found')) {
      const result = await firebase.auth().createUserWithEmailAndPassword('test001@ids111.com', 'Test@123');
      await db.ref(`users/${result.user!.uid}`).set({
        matricNo: 'test001',
        name: 'Test Student',
        email: 'test001@ids111.com',
        role: 'student',
      });
      return result.user!;
    }
    throw error;
  }
}

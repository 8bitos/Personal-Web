import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';

const cfg = window.EIGHTBIT_FIREBASE_CONFIG || {};
const configured = Boolean(cfg.apiKey && cfg.authDomain && cfg.projectId && cfg.appId);

let app = null;
let auth = null;
let db = null;
let currentUser = null;
const authListeners = new Set();

if (configured) {
  app = initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);
  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
    authListeners.forEach((cb) => {
      try { cb(currentUser); } catch (err) { console.error(err); }
    });
  });
}

window.EIGHTBIT_CLOUD = {
  isConfigured: () => configured,
  getUser: () => currentUser,
  onAuthChange: (cb) => {
    authListeners.add(cb);
    if (configured) cb(currentUser);
    return () => authListeners.delete(cb);
  },
  signInWithGoogle: async () => {
    if (!configured || !auth) throw new Error('FIREBASE_NOT_CONFIGURED');
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      return res.user;
    } catch (err) {
      if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment')) {
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw err;
    }
  },
  signOutUser: async () => {
    if (!configured || !auth) return;
    await signOut(auth);
  },
  saveBackup: async (payload) => {
    if (!configured || !db || !currentUser) throw new Error('NOT_SIGNED_IN');
    await setDoc(doc(db, 'users', currentUser.uid), payload);
  },
  loadBackup: async () => {
    if (!configured || !db || !currentUser) throw new Error('NOT_SIGNED_IN');
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    return snap.exists() ? snap.data() : null;
  }
};

window.dispatchEvent(new Event('eightbitcloud:ready'));

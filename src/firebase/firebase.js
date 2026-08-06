// src/firebase/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDFoXyAERWiVy5InNe_Zv9wlNc-vJW4XiY",
  authDomain: "snacc-62f72.firebaseapp.com",
  databaseURL: "https://snacc-62f72-default-rtdb.firebaseio.com",
  projectId: "snacc-62f72",
  storageBucket: "snacc-62f72.firebasestorage.app",
  messagingSenderId: "638729535812",
  appId: "1:638729535812:web:efafefe44d2cbbe3529711",
  measurementId: "G-665DL1GQ5S"
};

let app = null;
let db = null;
let auth = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { app, db, auth };

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDw7e9JcB4SnsFd9FlC1MQwLUQkdKWhMDQ",
  authDomain: "oldwotlk.firebaseapp.com",
  projectId: "oldwotlk",
  storageBucket: "oldwotlk.firebasestorage.app",
  messagingSenderId: "720898983196",
  appId: "1:720898983196:web:7ba5fcb2f6d2e1cc15a6d9",
};

// Evita inicializar la app varias veces (importante en Next.js con hot-reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

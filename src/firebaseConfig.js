// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC79svVTo_VdUiaUfrQPUyJekAAhdPm8dE",
  authDomain: "listasespeciales.firebaseapp.com",
  projectId: "listasespeciales",
  storageBucket: "listasespeciales.firebasestorage.app",
  messagingSenderId: "988485725738",
  appId: "1:988485725738:web:47b135a64060d9d60a9d53",
  measurementId: "G-MJ9SXGFFXW"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios que usarás
export const auth      = getAuth(app);
export const db        = getFirestore(app);
export const analytics = getAnalytics(app);


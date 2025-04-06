import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_0gthfL1bPC2x_InVsNDXTdY3CdIUpdA",
  authDomain: "banco-de-dados-abc12.firebaseapp.com",
  databaseURL: "https://banco-de-dados-abc12-default-rtdb.firebaseio.com",
  projectId: "banco-de-dados-abc12",
  storageBucket: "banco-de-dados-abc12.firebasestorage.app",
  messagingSenderId: "48050327288",
  appId: "1:48050327288:web:9599086d34ef3e3a63f50d"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

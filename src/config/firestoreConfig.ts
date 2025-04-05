import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCbqEy_tPcSuYpCHnmKp7GKGMYqHhiGgXk",
  authDomain: "mauriciodallonder-64688.firebaseapp.com",
  databaseURL: "https://mauriciodallonder-64688-default-rtdb.firebaseio.com",
  projectId: "mauriciodallonder-64688",
  storageBucket: "mauriciodallonder-64688.appspot.com",
  messagingSenderId: "600780731290",
  appId: "1:600780731290:web:34edbcb57ee87965170023"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);

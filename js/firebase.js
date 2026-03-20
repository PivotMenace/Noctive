import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUHWXemBpfAWOSDqj1_rY6s4oQr27FnKg",
  authDomain: "noctive-41c22.firebaseapp.com",
  projectId: "noctive-41c22",
  storageBucket: "noctive-41c22.firebasestorage.app",
  messagingSenderId: "617642134193",
  appId: "1:617642134193:web:ea5f0c93e56c654f66f090",
  measurementId: "G-8ZFW3MTB3C"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
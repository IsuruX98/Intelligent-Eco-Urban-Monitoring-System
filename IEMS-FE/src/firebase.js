// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database"; // For Realtime Database
// or for Firestore use:
// import { getFirestore, collection, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcalgO9vafdMBjemg1fqik0c2nYyz7ujU",
  authDomain: "esp-32-firebase-90634.firebaseapp.com",
  databaseURL: "https://esp-32-firebase-90634-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp-32-firebase-90634",
  storageBucket: "esp-32-firebase-90634.firebasestorage.app",
  messagingSenderId: "627135290506",
  appId: "1:627135290506:web:d8cc3791c3cc774e9b6173"
};


const app = initializeApp(firebaseConfig);

const database = getDatabase(app); // For Realtime Database
// const firestore = getFirestore(app); // For Firestore

export { database };
// export { firestore };

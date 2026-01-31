// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBao9XX8P5jASB4JMUKYLNUb3_AXfz24_4",
    authDomain: "munchkin-counter-5a1e3.firebaseapp.com",
    projectId: "munchkin-counter-5a1e3",
    storageBucket: "munchkin-counter-5a1e3.firebasestorage.app",
    databaseURL: "https://munchkin-counter-5a1e3-default-rtdb.europe-west1.firebasedatabase.app",
    messagingSenderId: "186260588347",
    appId: "1:186260588347:web:9f16817eb3a69c28f4991e",
    measurementId: "G-NNP50QB0JV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getDatabase(app);

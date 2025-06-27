// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAutefzlExMAOvbifI3Xb1xuWQVOO2PUQ0",
  authDomain: "orbitaldefensegame-6e898.firebaseapp.com",
  projectId: "orbitaldefensegame-6e898",
  storageBucket: "orbitaldefensegame-6e898.firebasestorage.app",
  messagingSenderId: "159713850300",
  appId: "1:159713850300:web:2afad55b35ec5aff41b1b9",
  measurementId: "G-GR6HN5F1WQ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
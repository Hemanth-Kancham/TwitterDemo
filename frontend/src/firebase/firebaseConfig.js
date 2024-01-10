import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDouJxZufRp_XV0snKjjqnKwM1499y4ncQ",
  authDomain: "fir-project-e7360.firebaseapp.com",
  projectId: "fir-project-e7360",
  storageBucket: "fir-project-e7360.appspot.com",
  messagingSenderId: "288958994409",
  appId: "1:288958994409:web:a7bb01dd40958c58c59d78",
  measurementId: "G-QK0DK9WELV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export default app;


import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import {getAuth} from  'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBYYIlwLa7BSatWukb5Cr1vAYvdMew67Gk",
  authDomain: "floormanager-d4e0e.firebaseapp.com",
  projectId: "floormanager-d4e0e",
  storageBucket: "floormanager-d4e0e.appspot.com",
  messagingSenderId: "9313816359",
  appId: "1:9313816359:web:c127e92c845510b4ffe302"
};


const app = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

export { db };

export const auth = getAuth();
 
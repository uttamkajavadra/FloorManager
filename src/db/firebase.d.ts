declare module 'db/firebase' {
    import { Firestore } from 'firebase/firestore';
    
    const db: Firestore;
    export { db };
  }
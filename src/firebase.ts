import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Firebase configuration
// NOTE: Replace these with your actual Firebase project credentials
// Get these from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'your-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'your-sender-id',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'your-app-id'
}

// Debug: Log config (remove after testing)
console.log('Firebase config loaded:', {
  apiKey: firebaseConfig.apiKey?.substring(0, 10) + '...',
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
})

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  // 1. Import Google Auth utilities
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // 2. signInWithGoogle is now correctly defined in the interface
  signInWithGoogle: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Watch authentication state
  useEffect(() => {
    if (!auth) {
      console.error('Firebase Auth is not initialized.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup listener on unmount
  }, []);

  // 🔹 Sign in existing user
  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign-in failed:', error.message);
      throw new Error(error.message);
    }
  };

  // 🔹 Register new user
  const signUp = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Sign-up failed:', error.message);
      throw new Error(error.message);
    }
  };

  // 🔹 Log out user
  const logout = async () => {
    if (!auth) throw new Error('Firebase not configured');
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      throw new Error(error.message);
    }
  };

  // 🚀 Sign in with Google
  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase not configured');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // User might close the popup or encounter a network error
      console.error('Google Sign-in failed:', error.message);
      throw new Error(error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
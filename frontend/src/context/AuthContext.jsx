import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';

const AuthContext = createContext(null);

const DEMO_USER_KEY = 'industry_brain_demo_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isFirebaseConfigured);

  useEffect(() => {
    // If Firebase is configured, listen to real auth changes
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Operator',
            photoURL: fbUser.photoURL,
            isDemo: false
          });
          setIsDemoMode(false);
        } else {
          // Check if there was an active demo session saved
          const savedDemo = localStorage.getItem(DEMO_USER_KEY);
          if (savedDemo) {
            setUser(JSON.parse(savedDemo));
            setIsDemoMode(true);
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // In Demo Mode: restore saved demo user or initialize null
      const savedDemo = localStorage.getItem(DEMO_USER_KEY);
      if (savedDemo) {
        setUser(JSON.parse(savedDemo));
      }
      setIsDemoMode(true);
      setLoading(false);
    }
  }, []);

  const loginWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      // Demo Mode login
      return loginAsDemo(email);
    }
    const res = await signInWithEmailAndPassword(auth, email, password);
    setIsDemoMode(false);
    return res.user;
  };

  const signupWithEmail = async (email, password) => {
    if (!isFirebaseConfigured || !auth) {
      return loginAsDemo(email);
    }
    const res = await createUserWithEmailAndPassword(auth, email, password);
    setIsDemoMode(false);
    return res.user;
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      return loginAsDemo('', 'Demo User');
    }
    const res = await signInWithPopup(auth, googleProvider);
    setIsDemoMode(false);
    return res.user;
  };

  const loginAsDemo = (email = '', displayName = 'Demo User') => {
    const demoUser = {
      uid: 'demo-user-' + Math.random().toString(36).substring(2, 8),
      email: email,
      displayName: displayName,
      isDemo: true
    };
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemoMode(true);
    return demoUser;
  };

  const logout = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.warn('Signout error:', e);
      }
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
  };

  const getIdToken = async () => {
    if (user && !user.isDemo && auth?.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return 'demo-token-active-operator';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isDemoMode,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsDemo,
        logout,
        getIdToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// lib/AuthContext.js
"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { db, auth, isFirebaseConfigured } from "./firebase";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from "firebase/auth";
import { preloadData } from "./db";

const withTimeout = (promise, timeoutMs = 10000, fallbackValue = null) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), timeoutMs)
    )
  ]).catch(() => fallbackValue);
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, name, email, type: 'student' | 'shop', shopId?: string }
  const [loading, setLoading] = useState(true);

  // Initialize and check sessions
  useEffect(() => {
    // 1. Preload local data in case simulation is active
    try {
      preloadData();
    } catch (e) {}

    // 2. Synchronize Firebase Auth state vs. Local Session
    let unsubscribeAuth = () => {};
    
    if (isFirebaseConfigured && auth) {
      unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            // Fetch student profile info from Firestore students collection
            const studentDocRef = doc(db, 'students', firebaseUser.uid);
            const studentSnap = await withTimeout(getDoc(studentDocRef), 8000, null);
            
            if (studentSnap && studentSnap.exists()) {
              const session = {
                id: firebaseUser.uid,
                name: studentSnap.data().name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                type: 'student'
              };
              setUser(session);
              localStorage.setItem("snaccier_session", JSON.stringify(session));
            } else {
              // Fallback if the profile document is missing in Firestore
              const session = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                email: firebaseUser.email,
                type: 'student'
              };
              setUser(session);
              localStorage.setItem("snaccier_session", JSON.stringify(session));
            }
          } catch (e) {
            console.error("Error fetching Firestore student profile:", e);
          }
        } else {
          // Check if there is an active local shop owner session
          try {
            const storedSession = localStorage.getItem("snaccier_session");
            if (storedSession) {
              const parsed = JSON.parse(storedSession);
              if (parsed && parsed.type === 'shop') {
                setUser(parsed);
                setLoading(false);
                return;
              }
            }
          } catch (err) {
            console.error("Malformed local session:", err);
            localStorage.removeItem("snaccier_session");
          }
          setUser(null);
        }
        setLoading(false);
      });
    } else {
      // Simulation fallback: Check local session storage directly
      try {
        const storedSession = localStorage.getItem("snaccier_session");
        if (storedSession) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setUser(JSON.parse(storedSession));
        }
      } catch (err) {
        console.error("Malformed local session fallback:", err);
        localStorage.removeItem("snaccier_session");
      }
      setLoading(false);
    }

    return () => unsubscribeAuth();
  }, []);

  // ==========================================
  // STUDENT AUTHENTICATION FLOWS (FIREBASE / LOCAL)
  // ==========================================

  const loginStudent = async (email, password) => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        const credentials = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = credentials.user;
        
        // Retrieve profile details with a timeout guard
        let studentSnap = null;
        try {
          const studentDocRef = doc(db, 'students', firebaseUser.uid);
          studentSnap = await withTimeout(getDoc(studentDocRef), 8000, null);
        } catch (fsErr) {
          console.warn("Failed to fetch Firestore student profile during login:", fsErr);
        }
        
        const session = {
          id: firebaseUser.uid,
          name: (studentSnap && studentSnap.exists()) ? studentSnap.data().name : (firebaseUser.displayName || email.split('@')[0]),
          email: firebaseUser.email,
          type: 'student'
        };
        setUser(session);
        try {
          localStorage.setItem("snaccier_session", JSON.stringify(session));
        } catch (e) {}
        setLoading(false);
        return true;
      } catch (error) {
        console.warn("Firebase Auth login failed, attempting LocalStorage simulation login...", error);
        
        // Local Storage Simulation Fallback
        try {
          const users = JSON.parse(localStorage.getItem("snaccier_users") || "[]");
          const found = users.find((u) => u.email === email && u.password === password);
          if (found) {
            const session = { id: found.id, name: found.name, email: found.email, type: "student" };
            setUser(session);
            try {
              localStorage.setItem("snaccier_session", JSON.stringify(session));
            } catch (e) {}
            setLoading(false);
            return true;
          }
        } catch (localErr) {
          console.error("Local login error:", localErr);
        }
        
        setLoading(false);
        throw new Error(error.message || "Invalid student email or password combination.");
      }
    }

    // Local Storage Simulation
    try {
      const users = JSON.parse(localStorage.getItem("snaccier_users") || "[]");
      const found = users.find((u) => u.email === email && u.password === password);
      if (found) {
        const session = { id: found.id, name: found.name, email: found.email, type: "student" };
        setUser(session);
        try {
          localStorage.setItem("snaccier_session", JSON.stringify(session));
        } catch (e) {}
        setLoading(false);
        return true;
      }
    } catch (e) {}
    setLoading(false);
    throw new Error("Invalid student email or password combination.");
  };

  const signupStudent = async (name, email, password) => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = credentials.user;
        
        // Update user display name in Firebase Auth
        try {
          await updateProfile(firebaseUser, { displayName: name });
        } catch (profileErr) {
          console.warn("Failed to set Firebase Auth displayName:", profileErr);
        }
        
        // Create matching student profile record inside Firestore 'students' collection
        try {
          const studentDocRef = doc(db, 'students', firebaseUser.uid);
          await withTimeout(
            setDoc(studentDocRef, {
              name,
              email,
              created_at: new Date().toISOString()
            }),
            8000,
            null
          );
        } catch (fsErr) {
          console.warn("Failed to create Firestore student profile during signup:", fsErr);
        }

        const session = {
          id: firebaseUser.uid,
          name,
          email,
          type: 'student'
        };
        setUser(session);
        try {
          localStorage.setItem("snaccier_session", JSON.stringify(session));
        } catch (e) {}
        setLoading(false);
        return true;
      } catch (error) {
        console.warn("Firebase Auth signup failed, attempting LocalStorage simulation signup...", error);
        
        try {
          const users = JSON.parse(localStorage.getItem("snaccier_users") || "[]");
          if (users.find(u => u.email === email)) {
            setLoading(false);
            throw new Error("Email address has already been registered on campus.");
          }
          
          const newUser = { id: `user_${Date.now()}`, name, email, password };
          users.push(newUser);
          localStorage.setItem("snaccier_users", JSON.stringify(users));
          
          const session = { id: newUser.id, name: newUser.name, email: newUser.email, type: "student" };
          setUser(session);
          localStorage.setItem("snaccier_session", JSON.stringify(session));
          setLoading(false);
          return true;
        } catch (localErr) {
          setLoading(false);
          throw new Error(error.message || "Registration failed. Please try again.");
        }
      }
    }

    // Local Storage Simulation
    try {
      const users = JSON.parse(localStorage.getItem("snaccier_users") || "[]");
      if (users.find(u => u.email === email)) {
        setLoading(false);
        throw new Error("Email address has already been registered on campus.");
      }
      
      const newUser = { id: `user_${Date.now()}`, name, email, password };
      users.push(newUser);
      localStorage.setItem("snaccier_users", JSON.stringify(users));
      
      const session = { id: newUser.id, name: newUser.name, email: newUser.email, type: "student" };
      setUser(session);
      localStorage.setItem("snaccier_session", JSON.stringify(session));
      setLoading(false);
      return true;
    } catch (e) {
      setLoading(false);
      throw new Error("Registration failed. Please try again.");
    }
  };

  // ==========================================
  // SHOP OPERATOR LIGHTWEIGHT PIN ACCESS FLOW
  // ==========================================

  const loginShop = async (shopId, pin) => {
    setLoading(true);
    
    if (isFirebaseConfigured && db) {
      try {
        const shopDocRef = doc(db, 'shops', shopId);
        const shopSnap = await withTimeout(getDoc(shopDocRef), 8000, null);
        
        if (shopSnap && shopSnap.exists() && shopSnap.data().pin === pin) {
          const session = {
            id: `owner_${shopId}`,
            name: `${shopSnap.data().name || 'Shop'} Operator`,
            type: "shop",
            shopId: shopId
          };
          setUser(session);
          localStorage.setItem("snaccier_session", JSON.stringify(session));
          setLoading(false);
          return true;
        }
      } catch (error) {
        console.error("Firebase shop login error:", error);
      }
    }

    // Local Storage Simulation Fallback
    const shops = JSON.parse(localStorage.getItem("snaccier_shops") || "[]");
    const shop = shops.find((s) => s.id === shopId && s.pin === pin);
    if (shop) {
      const session = { 
        id: `owner_${shop.id}`, 
        name: `${shop.name} Operator`, 
        type: "shop", 
        shopId: shop.id 
      };
      setUser(session);
      localStorage.setItem("snaccier_session", JSON.stringify(session));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const logout = async () => {
    setLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Firebase Auth signout error:", e);
      }
    }
    setUser(null);
    localStorage.removeItem("snaccier_session");
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginStudent, signupStudent, loginShop, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/config/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import axios from "axios";

const UserContext = createContext(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("UserContext: Setting up auth state listener");
    
    const storedUser = localStorage.getItem("firebaseUser");
    const storedStudent = localStorage.getItem("student");
    
    if (storedUser) {
      console.log("UserContext: Found stored user data");
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("UserContext: Error parsing stored user:", e);
        localStorage.removeItem("firebaseUser");
      }
    }
    
    if (storedStudent) {
      console.log("UserContext: Found stored student data");
      try {
        setStudent(JSON.parse(storedStudent));
      } catch (e) {
        console.error("UserContext: Error parsing stored student:", e);
        localStorage.removeItem("student");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("UserContext: Auth state changed:", firebaseUser ? firebaseUser.uid : "No user");
      
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified
        };
        
        console.log("UserContext: User data:", userData);
        setUser(userData);
        localStorage.setItem("firebaseUser", JSON.stringify(userData));
        
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("firebaseToken", token);
          console.log("UserContext: Token stored in localStorage");
        } catch (e) {
          console.error("UserContext: Error getting token:", e);
        }
      } else {
        console.log("UserContext: No user, clearing data");
        setUser(null);
        setStudent(null);
        localStorage.removeItem("firebaseUser");
        localStorage.removeItem("firebaseToken");
        localStorage.removeItem("student");
      }
      
      setLoading(false);
    });

    return () => {
      console.log("UserContext: Cleaning up auth listener");
      unsubscribe();
    };
  }, []);

  const syncStudentWithBackend = async (firebaseUser, name = null) => {
    console.log("UserContext: Syncing student with backend");
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/student`, {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: name || firebaseUser.displayName || firebaseUser.email.split('@')[0],
        profilePhoto: firebaseUser.photoURL || null,
        contactNumber: null
      });
      
      console.log("UserContext: Backend response:", response.data);
      
      if (response.data.success) {
        setStudent(response.data.data);
        localStorage.setItem("student", JSON.stringify(response.data.data));
        console.log("UserContext: Student synced successfully");
        return response.data.data;
      } else {
        throw new Error(response.data.message || "Failed to sync student");
      }
    } catch (error) {
      console.error("UserContext: Error syncing student:", error);
      setError(error.response?.data?.message || error.message);
      throw error;
    }
  };

  const fetchStudent = async (firebaseUid) => {
    console.log("UserContext: Fetching student:", firebaseUid);
    
    try {
      const response = await axios.get(`${API_URL}/api/auth/student/${firebaseUid}`);
      
      if (response.data.success) {
        setStudent(response.data.data);
        localStorage.setItem("student", JSON.stringify(response.data.data));
        console.log("UserContext: Student fetched successfully");
        return response.data.data;
      }
    } catch (error) {
      console.error("UserContext: Error fetching student:", error);
      return null;
    }
  };

  const logout = async () => {
    console.log("UserContext: Logging out");
    
    try {
      await signOut(auth);
      setUser(null);
      setStudent(null);
      localStorage.removeItem("firebaseUser");
      localStorage.removeItem("firebaseToken");
      localStorage.removeItem("student");
      console.log("UserContext: Logout successful");
    } catch (error) {
      console.error("UserContext: Logout error:", error);
      setError(error.message);
      throw error;
    }
  };

  const refreshToken = async () => {
    console.log("UserContext: Refreshing token");
    
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        localStorage.setItem("firebaseToken", token);
        console.log("UserContext: Token refreshed");
        return token;
      }
      return null;
    } catch (error) {
      console.error("UserContext: Error refreshing token:", error);
      throw error;
    }
  };

  const value = {
    user,
    student,
    loading,
    error,
    setUser,
    setStudent,
    syncStudentWithBackend,
    fetchStudent,
    logout,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

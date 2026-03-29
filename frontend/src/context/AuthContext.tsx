"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

// Define shape of auth state
interface User {
  id: string;
  company_id: string;
  role: string;
  email: string;
  name: string;
   designation?: string | null; 
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Define the context API surface
interface AuthContextType extends AuthState {
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const AuthContext = createContext<AuthContextType>({
  ...initialState,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);
  const router = useRouter();

  // Initialize from local storage on client load
  useEffect(() => {
    const initializeAuth = () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setAuthState({
            user: parsedUser,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Set default axios header
          axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        } catch (e) {
          console.error("Failed to parse user from local storage", e);
          // Clean up corrupted state
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthState({ ...initialState, isLoading: false });
        }
      } else {
        setAuthState({ ...initialState, isLoading: false });
      }
    };

    initializeAuth();
  }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    
    // Set default axios header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    setAuthState({
      user: userData,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    
    // Remove default axios header
    delete axios.defaults.headers.common["Authorization"];

    setAuthState({ ...initialState, isLoading: false });
    router.push("/login"); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

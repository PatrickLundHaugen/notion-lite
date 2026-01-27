import { useState, useEffect, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import { auth } from "../utils/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(auth.getToken);

  useEffect(() => {
    if (token) {
      localStorage.setItem("authToken", token);
    } else {
      localStorage.removeItem("authToken");
    }
  }, [token]);

  const login = (newToken: string) => {
    auth.setToken(newToken);
    setToken(newToken);
  };

  const logout = () => {
    auth.logout();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

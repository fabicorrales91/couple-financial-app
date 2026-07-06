import * as React from "react";
import { api, setToken, UNAUTHORIZED_EVENT } from "../lib/api";
import { decodeJwt, type JwtPayload } from "../lib/jwt";

interface AuthContextValue {
  user: JwtPayload | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const stored = localStorage.getItem("app_financiera_token");
    if (stored) {
      const payload = decodeJwt(stored);
      if (payload && (!payload.exp || payload.exp * 1000 > Date.now())) {
        setUser(payload);
      } else {
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  async function login(email: string, password: string) {
    const result = await api.post<{ token: string }>("/auth/login", {
      email,
      password,
    });
    setToken(result.token);
    setUser(decodeJwt(result.token));
  }

  async function register(email: string, password: string, name: string) {
    const result = await api.post<{ token: string }>("/auth/register", {
      email,
      password,
      name,
    });
    setToken(result.token);
    setUser(decodeJwt(result.token));
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}

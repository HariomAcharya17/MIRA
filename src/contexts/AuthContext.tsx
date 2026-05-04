import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type User = { id: string; name: string; email: string };
type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("mira-user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem("mira-user", JSON.stringify(user));
    else localStorage.removeItem("mira-user");
  }, [user]);

  const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error("Email and password required");
    // Local-only auth (no backend yet). Recognizes any previously signed-up email.
    const accountsRaw = localStorage.getItem("mira-accounts");
    const accounts: Record<string, { name: string; password: string }> = accountsRaw ? JSON.parse(accountsRaw) : {};
    const account = accounts[email.toLowerCase()];
    if (!account) throw new Error("No account found. Please sign up first.");
    if (account.password !== password) throw new Error("Incorrect password.");
    setUser({ id: email.toLowerCase(), name: account.name, email });
  };

  const signup = async (name: string, email: string, password: string) => {
    if (!name || !email || !password) throw new Error("All fields are required");
    const accountsRaw = localStorage.getItem("mira-accounts");
    const accounts: Record<string, { name: string; password: string }> = accountsRaw ? JSON.parse(accountsRaw) : {};
    if (accounts[email.toLowerCase()]) throw new Error("Account already exists. Please log in.");
    accounts[email.toLowerCase()] = { name, password };
    localStorage.setItem("mira-accounts", JSON.stringify(accounts));
    setUser({ id: email.toLowerCase(), name, email });
  };

  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

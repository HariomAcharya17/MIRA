import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type User = { id: string; name: string; email: string };
type MockUser = { id: string; name: string; email: string; password?: string };
type AuthContextType = {
  user: User | null;
  loading: boolean;
  isMock: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  // Setup default mock users if mock database is empty
  useEffect(() => {
    const mockDb = localStorage.getItem("mira-mock-db-users");
    if (!mockDb) {
      localStorage.setItem(
        "mira-mock-db-users",
        JSON.stringify([
          {
            id: "mira-operator-default",
            name: "Default Operator",
            email: "admin@mira.io",
            password: "password",
          },
        ])
      );
    }
  }, []);

  useEffect(() => {
    let active = true;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

    async function checkSession() {
      // Fast check: If Supabase URL is empty, placeholder or matches the broken URL, immediately switch to mock
      if (
        !supabaseUrl ||
        supabaseUrl.includes("your-supabase-url") ||
        supabaseUrl.includes("oezibyvtbnrhjuavazmv")
      ) {
        console.warn("Supabase is not configured or uses a broken project URL. Falling back to local Mock Auth.");
        if (active) enableMockAuth();
        return;
      }

      try {
        // Try getting session. If the domain doesn't resolve (e.g. ERR_NAME_NOT_RESOLVED), this throws a fetch error.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (active) {
          if (session?.user) {
            setUser({
              id: session.user.id,
              name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "Operator",
              email: session.user.email || "",
            });
          }
          setIsMock(false);
          setLoading(false);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          if (active) {
            if (session?.user) {
              setUser({
                id: session.user.id,
                name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || "Operator",
                email: session.user.email || "",
              });
            } else {
              setUser(null);
            }
            setIsMock(false);
            setLoading(false);
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Supabase connection failed. Falling back to Local Mock Auth.", err);
        if (active) enableMockAuth();
      }
    }

    function enableMockAuth() {
      setIsMock(true);
      
      // Clear old Supabase auth tokens from localStorage to prevent background refresh error triggers
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
          localStorage.removeItem(key);
        }
      });

      const savedUser = localStorage.getItem("mira-mock-user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem("mira-mock-user");
        }
      }
      setLoading(false);
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isMock) {
      // Simulate response latency
      await new Promise((resolve) => setTimeout(resolve, 800));

      const mockDbRaw = localStorage.getItem("mira-mock-db-users");
      const users: MockUser[] = mockDbRaw ? JSON.parse(mockDbRaw) : [];
      const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!matched) {
        throw new Error("Operator identity signature not found. Please register first.");
      }
      if (matched.password !== password) {
        throw new Error("Invalid cipher key signature.");
      }

      const loggedUser = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
      };

      localStorage.setItem("mira-mock-user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signup = async (name: string, email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockDbRaw = localStorage.getItem("mira-mock-db-users");
      const users: MockUser[] = mockDbRaw ? JSON.parse(mockDbRaw) : [];
      
      const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        throw new Error("This email is already linked to a neural signature.");
      }

      const newUser = {
        id: `mock-user-${crypto.randomUUID()}`,
        name: cleanName,
        email: cleanEmail,
        password: password,
      };

      users.push(newUser);
      localStorage.setItem("mira-mock-db-users", JSON.stringify(users));

      // Log in automatically
      const sessionUser = { id: newUser.id, name: newUser.name, email: newUser.email };
      localStorage.setItem("mira-mock-user", JSON.stringify(sessionUser));
      setUser(sessionUser);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    if (isMock) {
      localStorage.removeItem("mira-mock-user");
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isMock) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockDbRaw = localStorage.getItem("mira-mock-db-users");
      const users: MockUser[] = mockDbRaw ? JSON.parse(mockDbRaw) : [];
      const matched = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!matched) {
        throw new Error("No neural signature found for this email address.");
      }
      
      // In mock mode, we'll reset the user's password to 'password' for testing purposes
      matched.password = "password";
      localStorage.setItem("mira-mock-db-users", JSON.stringify(users));
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isMock, login, signup, logout, resetPassword }}>
      {/* Prevent app flicker by waiting for the initial auth check */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};


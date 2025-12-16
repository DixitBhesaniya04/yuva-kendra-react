import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "../types";
import { supabase } from "./supabaseClient";

interface AuthContextType extends AuthState {
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Fetch profile with a strict timeout to prevent hanging
  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Profile fetch timed out")), 5000)
      );

      // Race the fetch against the timeout
      // @ts-ignore
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      const { data, error } = result as any;

      if (error) throw error;

      if (data) {
        setUser({ ...data, email: email || data.email } as User);
      } else {
        // No profile row found -> Use fallback
        console.warn("No profile found in DB, using session fallback");
        setUser({
          id: userId,
          name: email?.split("@")[0] || "User",
          email: email || "",
          role: "member",
        });
      }
    } catch (e) {
      console.warn(
        "Profile fetch failed or timed out, using fallback. Check Supabase connection.",
        e
      );
      // Fallback on error/timeout
      setUser({
        id: userId,
        name: email?.split("@")[0] || "User",
        email: email || "",
        role: "member",
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Also timeout the session check just in case the client config is bad
        const sessionPromise = await supabase.auth.getSession();
        // const timeoutPromise = new Promise((_, reject) =>
        //   setTimeout(() => reject(new Error("Session check timed out")), 1000)
        // );

        // @ts-ignore
        const {
          data: { session },
        } = (await Promise.race([sessionPromise])) as any;

        if (session?.user) {
          if (mounted) {
            await fetchProfile(session.user.id, session.user.email);
          }
        } else {
          if (mounted) setUser(null);
        }
      } catch (error) {
        console.error("Session check failed or timed out:", error);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only fetch profile on sign-in events to avoid redundant calls
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }

      // Ensure loading is cleared
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    if (!password) return false;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Login error:", error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error("Unexpected login error:", e);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { posthog } from "@/lib/posthog";
import type { ApiError, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from /api/auth/me on mount (cookie is sent automatically)
  useEffect(() => {
    async function hydrate() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const u = {
            id: data.id,
            email: data.email,
            name: data.name,
            avatar_url: data.avatar_url,
            credits: data.credits ?? 0,
            created_at: data.created_at,
          };
          setUser(u);
          posthog.identify(u.id, { email: u.email, name: u.name });
        }
      } catch {
        // Not authenticated — that's fine
      } finally {
        // Clean up any legacy localStorage tokens
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setIsLoading(false);
      }
    }

    hydrate();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // Dev bypass: empty fields → hit dev-login endpoint
      const endpoint =
        !email && !password ? "/api/auth/dev-login" : "/api/auth/login";
      const body = !email && !password ? {} : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err: ApiError = await res.json();
        throw new Error(err.message);
      }

      const data = await res.json();
      setUser(data.user);
      posthog.identify(data.user.id, { email: data.user.email, name: data.user.name });
      posthog.capture("user_logged_in");
      router.push("/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, name, password }),
      });

      if (!res.ok) {
        const err: ApiError = await res.json();
        throw new Error(err.message);
      }

      const data = await res.json();
      setUser(data.user);
      posthog.identify(data.user.id, { email: data.user.email, name: data.user.name });
      posthog.capture("user_signed_up");
      router.push("/dashboard");
    },
    [router]
  );

  const loginWithGoogle = useCallback(() => {
    // After Google OAuth, the backend sets the cookie and redirects
    // to /auth/google/callback, which hydrates the user from /api/auth/me
    async function hydrate() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const u = {
            id: data.id,
            email: data.email,
            name: data.name,
            avatar_url: data.avatar_url,
            credits: data.credits ?? 0,
            created_at: data.created_at,
          };
          setUser(u);
          posthog.identify(u.id, { email: u.email, name: u.name });
          posthog.capture("user_logged_in", { method: "google" });
          router.push("/dashboard");
        }
      } catch {
        // Will be handled by the callback page
      }
    }
    hydrate();
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Best-effort
    }
    posthog.reset();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, loginWithGoogle, logout }),
    [user, isLoading, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

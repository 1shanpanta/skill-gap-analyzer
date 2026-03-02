"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Signing you in...</span>
          </div>
        </main>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (!token || !userParam) {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/login");
      return;
    }

    try {
      const user: User = JSON.parse(decodeURIComponent(userParam));
      // Clean the URL
      window.history.replaceState({}, "", "/auth/google/callback");
      loginWithToken(token, user);
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/login");
    }
  }, [searchParams, router, loginWithToken]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </main>
  );
}

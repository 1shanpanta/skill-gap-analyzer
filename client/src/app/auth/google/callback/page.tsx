"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    // The backend already set the httpOnly cookie during the OAuth redirect.
    // Just hydrate the user from /api/auth/me and navigate to the dashboard.
    try {
      loginWithGoogle();
    } catch {
      toast.error("Google sign-in failed. Please try again.");
      router.replace("/login");
    }
  }, [router, loginWithGoogle]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </main>
  );
}

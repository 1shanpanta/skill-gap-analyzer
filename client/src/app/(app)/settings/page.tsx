"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Lock,
  Shield,
  Calendar,
  BarChart3,
  Check,
  X,
  CreditCard,
  Coins,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { posthog } from "@/lib/posthog";
import type { UserProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function SettingsPage() {
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        setProfile(await res.json());
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Show success toast when returning from checkout
  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      toast.success("Payment successful! Credits have been added to your account.");
      posthog.capture("credits_purchased");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="mt-2 h-4 w-56" />
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-16" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Failed to load profile.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your account details and sign-in options
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
          <CardDescription>The basics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Name</span>
              <p className="font-medium">{profile.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Joined</span>
              <span className="font-medium">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Analyses</span>
              <span className="font-medium">{profile.total_analyses}</span>
            </div>
          </div>

          <EditNameForm
            currentName={profile.name}
            onUpdated={(name) => setProfile({ ...profile, name })}
          />
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4" />
            Analysis Credits
          </CardTitle>
          <CardDescription>
            Each analysis uses 1 credit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{profile.credits}</p>
              <p className="text-sm text-muted-foreground">
                {profile.credits === 1
                  ? "credit remaining"
                  : "credits remaining"}
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm" variant={profile.credits === 0 ? "default" : "outline"}>
                <CreditCard className="mr-2 h-4 w-4" />
                Buy credits
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      {profile.has_password && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      )}

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Connected Accounts
          </CardTitle>
          <CardDescription>
            Ways you can sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <div>
                <p className="text-sm font-medium">Google</p>
                <p className="text-xs text-muted-foreground">
                  {profile.has_google ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>

            {profile.has_google ? (
              <UnlinkGoogleButton
                hasPassword={profile.has_password}
                onUnlinked={() => setProfile({ ...profile, has_google: false })}
              />
            ) : (
              <GoogleSignInButton label="Connect" />
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email & Password</p>
                <p className="text-xs text-muted-foreground">
                  {profile.has_password ? "Set" : "Not set"}
                </p>
              </div>
            </div>
            {profile.has_password ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <a
                href="/forgot-password"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Set a password
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EditNameForm({
  currentName,
  onUpdated,
}: {
  currentName: string;
  onUpdated: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || name === currentName) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      onUpdated(name.trim());
      toast.success("Name updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
      >
        Edit name
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="max-w-[200px]"
        autoFocus
        disabled={saving}
      />
      <Button size="icon" variant="ghost" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          setName(currentName);
          setEditing(false);
        }}
        disabled={saving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-pw">Current password</Label>
        <Input
          id="current-pw"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={saving}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-pw">New password</Label>
        <Input
          id="new-pw"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={saving}
          required
        />
        <p className="text-xs text-muted-foreground">
          8+ characters, must include a letter and a number
        </p>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={saving || !currentPassword || !newPassword}
      >
        {saving && <Loader2 className="animate-spin" />}
        {saving ? "Changing..." : "Change password"}
      </Button>
    </form>
  );
}

function UnlinkGoogleButton({
  hasPassword,
  onUnlinked,
}: {
  hasPassword: boolean;
  onUnlinked: () => void;
}) {
  const [unlinking, setUnlinking] = useState(false);

  async function handleUnlink() {
    if (!hasPassword) {
      toast.error("Set a password first before unlinking Google");
      return;
    }

    setUnlinking(true);
    try {
      const res = await apiFetch("/api/auth/unlink-google", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      toast.success("Google account unlinked");
      onUnlinked();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unlink");
    } finally {
      setUnlinking(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUnlink}
      disabled={unlinking}
    >
      {unlinking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
    </Button>
  );
}

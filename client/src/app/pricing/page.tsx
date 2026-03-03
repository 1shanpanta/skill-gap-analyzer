"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  BarChart3,
  Check,
  Loader2,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { posthog } from "@/lib/posthog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const packs = [
  {
    key: "pack_10",
    credits: 5,
    price: "$5",
    perCredit: "$1.00",
    label: "Starter",
    popular: false,
    best: false,
  },
  {
    key: "pack_30",
    credits: 15,
    price: "$10",
    perCredit: "$0.67",
    label: "Standard",
    popular: true,
    best: false,
  },
  {
    key: "pack_100",
    credits: 50,
    price: "$25",
    perCredit: "$0.50",
    label: "Pro",
    popular: false,
    best: true,
  },
];

const features = [
  "Match score with weighted breakdown",
  "Skills you have vs. skills you're missing",
  "Partial matches and close-but-not-exact skills",
  "Seniority alignment check",
  "Personalized learning roadmap",
  "Resume suggestions specific to the job",
  "GitHub profile signals (optional)",
];

export default function PricingPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  async function handleBuy(packKey: string) {
    if (!user) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    setLoadingPack(packKey);
    posthog.capture("credit_pack_clicked", { pack: packKey });
    try {
      const res = await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ pack: packKey }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create checkout");
      }

      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Skill Gap Analyzer
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            {!isLoading &&
              (user ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              ))}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, pay-as-you-go pricing
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your first analysis is free. After that, buy credits whenever you
            need them. No subscriptions, no commitments.
          </p>
        </div>
      </section>

      {/* Free tier callout */}
      <section className="container mx-auto px-4 pb-8">
        <div className="mx-auto max-w-sm rounded-lg border bg-muted/30 p-6 text-center">
          <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary" />
          <h3 className="font-semibold">1 free analysis</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Every account gets one analysis on the house. No credit card
            needed.
          </p>
          {!isLoading && !user && (
            <Link href="/register">
              <Button size="sm" variant="outline" className="mt-3">
                Create free account
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Credit packs */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-3">
          {packs.map((pack) => (
            <Card
              key={pack.key}
              className={
                pack.popular
                  ? "relative border-primary shadow-md"
                  : "relative"
              }
            >
              {pack.popular && (
                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              {pack.best && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  Best Value
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{pack.label}</CardTitle>
                <CardDescription>
                  {pack.credits} analyses
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-1 text-3xl font-bold">{pack.price}</div>
                <p className="mb-4 text-sm text-muted-foreground">
                  {pack.perCredit} per analysis
                </p>
                <Button
                  className="w-full"
                  variant={pack.popular ? "default" : "outline"}
                  disabled={loadingPack !== null}
                  onClick={() => handleBuy(pack.key)}
                >
                  {loadingPack === pack.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Buy ${pack.credits} credits`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What's included */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl">
            <h2 className="mb-6 text-center text-xl font-semibold">
              Every analysis includes
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Skill Gap Analyzer
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

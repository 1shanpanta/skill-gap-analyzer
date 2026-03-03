"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user ? "Go to Dashboard" : "Try it free";

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
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            {!isLoading && (
              user ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign in</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign up</Button>
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            How well does your resume match this job?
          </h1>

          <p className="text-lg text-muted-foreground">
            Paste your resume and a job description. Get an instant
            skill-by-skill breakdown, a match score, and a plan for
            what to learn next.
          </p>

          <div>
            <Link href={ctaHref}>
              <Button size="lg" className="gap-2">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-xl font-semibold sm:text-2xl">
              Here&apos;s how it works
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Paste your resume</h3>
                  <p className="text-sm text-muted-foreground">
                    Drop in the text — your skills get extracted automatically.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Add a job description</h3>
                  <p className="text-sm text-muted-foreground">
                    Copy the job posting you&apos;re interested in.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </div>
                <div>
                  <h3 className="font-medium">See what lines up and what doesn&apos;t</h3>
                  <p className="text-sm text-muted-foreground">
                    You get a score, a skill-by-skill comparison, and
                    suggestions for what to work on.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold sm:text-2xl">
              What the analysis includes
            </h2>

            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {[
                "Match score with a weighted breakdown",
                "Skills you have vs. skills you're missing",
                "Partial matches (close but not exact)",
                "Seniority alignment check",
                "A learning roadmap for your gaps",
                "Resume suggestions specific to the job",
                "GitHub profile signals (optional)",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Takes about a minute. First analysis is free.
            </h2>
            <p className="mt-2 text-muted-foreground">
              No credit card required — just paste and go.
            </p>
            <div className="mt-6">
              <Link href={ctaHref}>
                <Button size="lg" className="gap-2">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
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
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:underline">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

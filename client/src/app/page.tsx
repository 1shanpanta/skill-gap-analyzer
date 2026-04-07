"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import {
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Moon,
  Sun,
  Shield,
  CreditCard,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  const ctaHref = user ? "/dashboard" : "/register";
  const ctaLabel = user ? "Go to Dashboard" : "Try it free";

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto flex h-14 items-center justify-between gap-2 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold min-h-[48px] shrink-0">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="hidden sm:inline">Skill Gap Analyzer</span>
            <span className="sm:hidden">SGA</span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
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
        </nav>
      </header>

      <main>
      {/* Hero */}
      <section className="container mx-auto px-4 py-12 sm:py-20 lg:py-28">
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

      {/* See it in action */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-8 text-xl font-semibold sm:text-2xl">
              See what you get
            </h2>

            <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="ml-2 flex-1 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                  skillgap.dev/analysis/a1b2c3d4
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Score gauge mock */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[6px] border-primary">
                    <span className="text-3xl font-bold">78%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Overall Match</p>
                </div>

                {/* Skill bars */}
                <div className="space-y-3">
                  {[
                    { name: "React", level: 92, matched: true },
                    { name: "TypeScript", level: 85, matched: true },
                    { name: "GraphQL", level: 0, matched: false },
                    { name: "AWS", level: 40, matched: false },
                  ].map((skill) => (
                    <div key={skill.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{skill.name}</span>
                        <span className={skill.matched ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                          {skill.matched ? "Matched" : skill.level > 0 ? "Partial" : "Missing"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${
                            skill.matched
                              ? "bg-green-500"
                              : skill.level > 0
                                ? "bg-yellow-500"
                                : "bg-red-300 dark:bg-red-800"
                          }`}
                          style={{ width: `${Math.max(skill.level, 4)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-6 text-xl font-semibold sm:text-2xl">
              Frequently asked questions
            </h2>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="scoring">
                <AccordionTrigger>How does the scoring work?</AccordionTrigger>
                <AccordionContent>
                  Your score is a weighted combination of skill matching,
                  seniority alignment, and optional GitHub signals. Required
                  skills count more than preferred ones. The breakdown shows
                  exactly how each factor contributed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy">
                <AccordionTrigger>Is my data private?</AccordionTrigger>
                <AccordionContent>
                  Yes. Your resume and job descriptions are stored securely and
                  never shared with third parties. You can delete any analysis
                  at any time, and the data is permanently removed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="pricing">
                <AccordionTrigger>How does pricing work?</AccordionTrigger>
                <AccordionContent>
                  You get free credits to start. Each analysis costs 1 credit.
                  When you need more, you can purchase credit packs — no
                  subscription required. Unused credits never expire.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="github">
                <AccordionTrigger>Do I need a GitHub account?</AccordionTrigger>
                <AccordionContent>
                  No. GitHub analysis is completely optional. If you provide a
                  GitHub profile URL, we&apos;ll factor in your public repos,
                  languages, and activity. Without it, scoring is based solely
                  on your resume vs. the job description.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="accuracy">
                <AccordionTrigger>How accurate is the analysis?</AccordionTrigger>
                <AccordionContent>
                  The analysis uses a combination of deterministic skill
                  matching and AI-powered extraction to catch synonyms and
                  related technologies. It&apos;s designed to give you a
                  realistic picture, not an inflated one — so you know exactly
                  where to focus.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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

      {/* Trust signals */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Your data is never shared</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Results in under a minute</span>
            </div>
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Skill Gap Analyzer
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
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

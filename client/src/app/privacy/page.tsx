import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Skill Gap Analyzer
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: March 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              What we collect
            </h2>
            <p>
              When you create an account, we collect your email address and
              name. If you sign in with Google, we also receive your Google
              profile ID and avatar URL. We do not collect or store your
              Google password.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              How resumes and job descriptions are processed
            </h2>
            <p>
              When you submit a resume and job description for analysis, the
              text is sent to a large language model (currently hosted on
              Groq) for skill extraction, scoring, and roadmap generation. We
              store the raw text you provide and the analysis results in our
              database so you can review them later. We do not sell or share
              your resume or job description text with third parties for
              marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              LLM processing
            </h2>
            <p>
              Analysis requests are processed by third-party LLM providers
              (currently Groq). Your resume and job description text is sent
              to these providers solely to generate your analysis. We do not
              use your data to train models. Please review Groq&apos;s privacy
              policy for how they handle data passed through their API.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Payment data
            </h2>
            <p>
              Payments are processed by DodoPayments, which acts as the
              Merchant of Record. We never see or store your full credit card
              number. DodoPayments handles all payment processing, tax
              collection, and compliance. We only store a reference to your
              DodoPayments customer ID and transaction IDs.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Cookies
            </h2>
            <p>
              We use a single httpOnly authentication cookie to keep you
              signed in. We do not use tracking cookies or third-party ad
              cookies. If you use PostHog analytics (which we may enable),
              it uses a first-party cookie to understand product usage — no
              data is sold to advertisers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Data retention
            </h2>
            <p>
              Your account data, saved resumes, and analysis results are
              retained as long as your account exists. If you delete your
              account, all associated data (resumes, job descriptions,
              analyses, notes, and purchase history) is permanently removed
              from our database.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Your rights
            </h2>
            <p>
              You can export or delete your data at any time through the
              settings page. If you have questions or requests about your
              data, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-foreground">
              Contact
            </h2>
            <p>
              For privacy-related questions, email{" "}
              <a
                href="mailto:privacy@skillgap.dev"
                className="text-primary underline-offset-4 hover:underline"
              >
                privacy@skillgap.dev
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Skill Gap Analyzer
          </div>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:underline">
              Pricing
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

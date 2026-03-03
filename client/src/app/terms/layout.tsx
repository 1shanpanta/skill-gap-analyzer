import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using Skill Gap Analyzer, including account usage, credit purchases, and acceptable use policies.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

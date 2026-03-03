import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Skill Gap Analyzer to run analyses and track your career progress.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}

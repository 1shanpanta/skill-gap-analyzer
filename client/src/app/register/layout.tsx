import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description:
    "Create a free Skill Gap Analyzer account. Get 1 free analysis to compare your resume against any job description.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

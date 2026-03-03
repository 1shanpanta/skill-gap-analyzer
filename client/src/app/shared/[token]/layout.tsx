import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Analysis",
  description:
    "View a shared Skill Gap Analyzer result — see the match score, skill breakdown, and learning roadmap.",
  openGraph: {
    title: "Shared Analysis | Skill Gap Analyzer",
    description: "Check out this resume-to-job skill gap analysis.",
  },
  robots: { index: false, follow: false },
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return children;
}

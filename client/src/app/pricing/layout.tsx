import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pay-as-you-go pricing for Skill Gap Analyzer. Your first analysis is free. Buy credit packs starting at $5.",
  openGraph: {
    title: "Pricing | Skill Gap Analyzer",
    description:
      "Simple pay-as-you-go pricing. First analysis free, then credit packs from $5.",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

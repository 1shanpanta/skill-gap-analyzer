import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const siteUrl = "https://skill-gap-analyzer-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Skill Gap Analyzer — Match Your Resume to Any Job",
    template: "%s | Skill Gap Analyzer",
  },
  description:
    "Paste your resume and a job description to get an instant skill-by-skill breakdown, match score, personalized learning roadmap, and resume suggestions.",
  keywords: [
    "skill gap analyzer",
    "resume analyzer",
    "job description matcher",
    "resume score",
    "career tool",
    "skill assessment",
    "learning roadmap",
    "resume improvement",
  ],
  authors: [{ name: "Skill Gap Analyzer" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Skill Gap Analyzer",
    title: "Skill Gap Analyzer — Match Your Resume to Any Job",
    description:
      "Paste your resume and a job description to get an instant skill-by-skill breakdown, match score, personalized learning roadmap, and resume suggestions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Skill Gap Analyzer — Match Your Resume to Any Job",
    description:
      "Paste your resume and a job description to get an instant skill-by-skill breakdown, match score, and a plan for what to learn next.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Skill Gap Analyzer",
  url: siteUrl,
  description:
    "Paste your resume and a job description to get an instant skill-by-skill breakdown, match score, personalized learning roadmap, and resume suggestions.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "First analysis free, then credit packs from $5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

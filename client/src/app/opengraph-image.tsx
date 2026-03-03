import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Skill Gap Analyzer — Match Your Resume to Any Job";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span style={{ color: "white", fontSize: 36, fontWeight: 700 }}>
            Skill Gap Analyzer
          </span>
        </div>

        <div
          style={{
            color: "#e2e8f0",
            fontSize: 52,
            fontWeight: 800,
            textAlign: "center",
            maxWidth: "900px",
            lineHeight: 1.2,
          }}
        >
          Match Your Resume to Any Job
        </div>

        <div
          style={{
            color: "#94a3b8",
            fontSize: 24,
            marginTop: "24px",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Skill breakdown, match score, and a learning roadmap — instantly.
        </div>
      </div>
    ),
    { ...size }
  );
}

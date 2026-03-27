"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score < 40) return "hsl(0, 84%, 60%)";
  if (score <= 60) return "hsl(25, 95%, 53%)";
  if (score <= 75) return "hsl(45, 93%, 47%)";
  return "hsl(152, 69%, 47%)";
}

function getScoreLabel(score: number): string {
  if (score < 40) return "Needs Work";
  if (score <= 60) return "Fair";
  if (score <= 75) return "Good";
  return "Excellent";
}

function getScoreGlow(score: number): string {
  if (score < 40) return "rgba(239, 68, 68, 0.15)";
  if (score <= 60) return "rgba(249, 115, 22, 0.15)";
  if (score <= 75) return "rgba(234, 179, 8, 0.15)";
  return "rgba(34, 197, 94, 0.15)";
}

export function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
  const strokeWidth = size * 0.07;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const progress = (clampedScore / 100) * circumference;
  const color = getScoreColor(clampedScore);
  const label = getScoreLabel(clampedScore);
  const glow = getScoreGlow(clampedScore);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: `0 0 ${size * 0.4}px ${size * 0.1}px ${glow}`,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-extrabold tracking-tight text-foreground"
            style={{ fontSize: size * 0.3 }}
          >
            {Math.round(clampedScore)}
          </span>
          <span
            className="text-muted-foreground"
            style={{ fontSize: size * 0.08 }}
          >
            out of 100
          </span>
        </div>
      </div>
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{
          color,
          backgroundColor: glow,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
    </div>
  );
}

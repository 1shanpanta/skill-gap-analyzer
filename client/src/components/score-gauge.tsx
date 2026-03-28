"use client";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

function getScoreColor(score: number): string {
  if (score < 40) return "#ef4444"; // red
  if (score <= 60) return "#f97316"; // orange
  if (score <= 75) return "#eab308"; // yellow
  return "#22c55e"; // green
}

function getScoreLabel(score: number): string {
  if (score < 40) return "Needs Work";
  if (score <= 60) return "Fair";
  if (score <= 75) return "Good";
  return "Excellent";
}

export function ScoreGauge({ score, size = 180 }: ScoreGaugeProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const progress = (clampedScore / 100) * circumference;
  const color = getScoreColor(clampedScore);
  const label = getScoreLabel(clampedScore);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress circle */}
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
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Score number overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-foreground"
            style={{ fontSize: size * 0.28 }}
          >
            {Math.round(clampedScore)}
          </span>
          <span
            className="text-muted-foreground font-medium"
            style={{ fontSize: size * 0.09 }}
          >
            out of 100
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

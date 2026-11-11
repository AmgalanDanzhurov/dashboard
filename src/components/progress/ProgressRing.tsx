import type { Progress } from "@/lib/domain/types";
import { formatProgress } from "@/lib/domain/progress";

type Props = {
  progress: Progress;
  color: string;
  label: string;
  /** Диаметр в пикселях. */
  size?: number;
};

const STROKE = 8;

export function ProgressRing({ progress, color, label, size = 96 }: Props) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress.percent / 100);
  const empty = progress.total === 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percent}
      aria-valuetext={formatProgress(progress)}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted"
        />
        {!empty ? (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
          />
        ) : null}
      </svg>
      <span className="absolute text-center text-sm font-semibold tabular-nums">
        {empty ? (
          <span className="text-xs font-normal text-muted-foreground">
            Нет задач
          </span>
        ) : (
          `${progress.percent}%`
        )}
      </span>
    </div>
  );
}

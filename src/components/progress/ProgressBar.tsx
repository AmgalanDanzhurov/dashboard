import type { Progress } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type Props = {
  progress: Progress;
  color: string;
  /** Что измеряем — для скринридера: «Прогресс раздела Учёба». */
  label: string;
  className?: string;
};

export function ProgressBar({ progress, color, label, className }: Props) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress.percent}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${progress.percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

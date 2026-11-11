import type { Tag } from "@/lib/domain/types";

/** Тег в строке задачи: цветная точка и имя. */
export function TagChip({ tag }: { tag: Pick<Tag, "name" | "color"> }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      <span
        aria-hidden
        className="size-1.5 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  );
}

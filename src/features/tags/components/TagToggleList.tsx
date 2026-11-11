"use client";

import { Check } from "lucide-react";

import type { Tag } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

type Props = {
  tags: readonly Tag[];
  value: readonly string[];
  onChange: (ids: string[]) => void;
  labelledBy: string;
};

/** Выбор нескольких тегов: кнопки-переключатели. */
export function TagToggleList({ tags, value, onChange, labelledBy }: Props) {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Тегов пока нет — их можно создать в настройках.
      </p>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex flex-wrap gap-2"
    >
      {tags.map((tag) => {
        const selected = value.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={selected}
            onClick={() =>
              onChange(
                selected
                  ? value.filter((id) => id !== tag.id)
                  : [...value, tag.id],
              )
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-foreground bg-accent"
                : "text-muted-foreground hover:bg-accent/60",
            )}
          >
            {selected ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
            )}
            {tag.name}
          </button>
        );
      })}
    </div>
  );
}

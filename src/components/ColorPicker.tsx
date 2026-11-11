"use client";

import { Check } from "lucide-react";
import { useId } from "react";

import { palette } from "@/lib/domain/palette";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (hex: string) => void;
  /** id подписи над палитрой, для aria-labelledby. */
  labelledBy: string;
};

/**
 * Выбор цвета из палитры. Обычные radio-кнопки: работают стрелки,
 * Tab и пробел без дополнительного кода.
 */
export function ColorPicker({ value, onChange, labelledBy }: Props) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="flex flex-wrap gap-2"
    >
      {palette.map(({ hex, name: colorName }) => (
        <label key={hex} className="cursor-pointer" title={colorName}>
          <input
            type="radio"
            name={name}
            value={hex}
            checked={value === hex}
            onChange={() => onChange(hex)}
            className="peer sr-only"
          />
          <span className="sr-only">{colorName}</span>
          <span
            aria-hidden
            className={cn(
              "flex size-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              value === hex && "ring-2 ring-foreground",
            )}
            style={{ backgroundColor: hex }}
          >
            {value === hex ? <Check className="size-4" /> : null}
          </span>
        </label>
      ))}
    </div>
  );
}

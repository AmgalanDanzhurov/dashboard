"use client";

import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Option<T extends string> = { value: T; label: string; color?: string };

type Props<T extends string> = {
  label: string;
  options: readonly Option<T>[];
  value: readonly T[];
  onChange: (value: T[]) => void;
};

/** Кнопка-фильтр с выбором нескольких значений. */
export function MultiSelectMenu<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  const summary =
    value.length === 0
      ? label
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? label)
        : `${label}: ${value.length}`;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={value.length ? "secondary" : "outline"}
          size="sm"
          aria-label={
            value.length ? `${label}: выбрано ${value.length}` : label
          }
        >
          {summary}
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            // Меню не закрывается: можно отметить несколько пунктов подряд.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...value, option.value]
                  : value.filter((v) => v !== option.value),
              )
            }
          >
            {option.color ? (
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: option.color }}
              />
            ) : null}
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

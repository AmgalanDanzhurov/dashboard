"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Светлая", icon: Sun },
  { value: "dark", label: "Тёмная", icon: Moon },
  { value: "system", label: "Как в системе", icon: Monitor },
] as const;

const subscribe = () => () => {};

/** Выбор темы: светлая, тёмная или как в системе. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  // Тема известна только в браузере: до гидрации ничего не отмечаем,
  // иначе разметка сервера и клиента разойдётся.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <section aria-labelledby="theme-heading" className="flex flex-col gap-3">
      <h2 id="theme-heading" className="text-lg font-semibold">
        Тема
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="theme-heading"
        className="inline-flex w-fit flex-wrap gap-1 rounded-lg border p-1"
      >
        {options.map(({ value, label, icon: Icon }) => {
          const checked = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setTheme(value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring",
                checked
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

"use client";

import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { mobileMoreItems, mobilePrimaryItems } from "./nav";
import { useIsActive } from "./use-active-path";

const itemClass = cn(
  "flex w-full flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground outline-none",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
);

export function MobileNav() {
  const isActive = useIsActive();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = mobileMoreItems.some((item) => isActive(item.href));

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
    >
      <ul className="grid grid-cols-5">
        {mobilePrimaryItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(itemClass, active && "text-foreground")}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn(itemClass, moreActive && "text-foreground")}
          >
            <Ellipsis className="size-5" aria-hidden />
            Ещё
          </button>
        </li>
      </ul>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle>Ещё</SheetTitle>
            <SheetDescription className="sr-only">
              Остальные разделы приложения
            </SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col px-2">
            {mobileMoreItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    // Закрываем панель: переход на страницу не размонтирует её.
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-3 text-base outline-none",
                      "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                      active && "bg-accent font-medium",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

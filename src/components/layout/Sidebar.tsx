"use client";

import Link from "next/link";

import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { cn } from "@/lib/utils";

import { navItems } from "./nav";
import { useIsActive } from "./use-active-path";

export function Sidebar() {
  const isActive = useIsActive();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
      <div className="px-3 text-lg font-semibold tracking-tight">Задачи</div>
      <nav aria-label="Основная навигация">
        <ul className="flex flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active &&
                      "bg-sidebar-accent text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      {/* Список разделов со ссылками появится на этапе 4, когда будут данные. */}
      <div className="mt-auto">
        <SignOutButton className="w-full" />
      </div>
    </aside>
  );
}

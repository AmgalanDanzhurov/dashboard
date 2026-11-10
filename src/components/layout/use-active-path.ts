"use client";

import { usePathname } from "next/navigation";

import { isSamePath, routes } from "@/lib/routes";

/**
 * Активен ли пункт меню. Страницы раздела и проекта подсвечивают «Разделы»,
 * потому что это их родительский список.
 */
export function useIsActive(): (href: string) => boolean {
  const pathname = usePathname();
  return (href) => {
    if (isSamePath(pathname, href)) return true;
    if (href === routes.areas) {
      return (
        isSamePath(pathname, "/area/") || isSamePath(pathname, "/project/")
      );
    }
    return false;
  };
}

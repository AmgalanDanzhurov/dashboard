// Единственное место, где собираются адреса страниц.
// Пути без basePath: next/link и useRouter добавляют его сами.
export const routes = {
  dashboard: "/",
  login: "/login/",
  areas: "/areas/",
  area: (id: string) => `/area/?id=${encodeURIComponent(id)}`,
  project: (id: string) => `/project/?id=${encodeURIComponent(id)}`,
  today: "/today/",
  habits: "/habits/",
  tasks: "/tasks/",
  stats: "/stats/",
  settings: "/settings/",
  /** Страница входа с адресом, куда вернуться после входа. */
  loginWithNext: (next: string) => `/login/?next=${encodeURIComponent(next)}`,
} as const;

/**
 * Куда вернуться после входа. Принимает только внутренние пути вида "/tasks/":
 * адрес из ?next= приходит из URL, и без проверки им можно увести пользователя
 * на чужой сайт ("//evil.com", "https://...").
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return routes.dashboard;
  }
  if (isSamePath(next.split("?")[0], routes.login)) return routes.dashboard;
  return next;
}

/** Сравнивает пути без учёта завершающего слэша: "/tasks" и "/tasks/" — одна страница. */
export function isSamePath(a: string, b: string): boolean {
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  return normalize(a) === normalize(b);
}

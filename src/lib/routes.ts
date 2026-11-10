// Единственное место, где собираются адреса страниц.
// Пути без basePath: next/link и useRouter добавляют его сами.
export const routes = {
  dashboard: "/",
  login: "/login/",
  areas: "/areas/",
  area: (id: string) => `/area/?id=${encodeURIComponent(id)}`,
  project: (id: string) => `/project/?id=${encodeURIComponent(id)}`,
  tasks: "/tasks/",
  stats: "/stats/",
  settings: "/settings/",
} as const;

/** Сравнивает пути без учёта завершающего слэша: "/tasks" и "/tasks/" — одна страница. */
export function isSamePath(a: string, b: string): boolean {
  const normalize = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  return normalize(a) === normalize(b);
}

// Ключи запросов TanStack Query. Ключи вложены: инвалидация ["areas"]
// обновит и список разделов, и их прогресс.
export const queryKeys = {
  areas: {
    all: ["areas"] as const,
    list: () => [...queryKeys.areas.all, "list"] as const,
    progress: () => [...queryKeys.areas.all, "progress"] as const,
  },
  projects: {
    all: ["projects"] as const,
    list: () => [...queryKeys.projects.all, "list"] as const,
    progress: () => [...queryKeys.projects.all, "progress"] as const,
  },
};

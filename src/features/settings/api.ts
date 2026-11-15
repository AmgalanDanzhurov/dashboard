import { todayISO } from "@/lib/domain/dates";
import { AppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase/client";
import { toDataError } from "@/lib/supabase/errors";

import { buildDemoTasks, demoAreas, demoProjects, demoTags } from "./demoData";

/** Пуст ли аккаунт: демо-данные можно добавить только в пустой. */
export async function isAccountEmpty(): Promise<boolean> {
  const supabase = getSupabase();
  const counts = await Promise.all(
    (["areas", "tasks", "tags"] as const).map((table) =>
      supabase.from(table).select("id", { count: "exact", head: true }),
    ),
  );
  const failed = counts.find((c) => c.error)?.error;
  if (failed) throw toDataError(failed, "проверить аккаунт");
  return counts.every((c) => (c.count ?? 0) === 0);
}

/**
 * Заполняет пустой аккаунт демо-данными. Записывает по шагам: разделы,
 * проекты, теги, задачи, связи задач с тегами. Если шаг не удался, уже
 * записанное остаётся — его можно удалить вместе с разделами.
 */
export async function seedDemoData(): Promise<void> {
  if (!(await isAccountEmpty())) {
    throw new AppError(
      "Демо-данные добавляются только в пустой аккаунт: сначала удалите разделы, задачи и теги.",
    );
  }
  const supabase = getSupabase();
  const fail = (error: { code?: string; message?: string }) =>
    toDataError(
      error,
      "добавить демо-данные (часть могла сохраниться — её можно удалить вместе с разделами)",
    );

  const areas = await supabase
    .from("areas")
    .insert(
      demoAreas.map((a, position) => ({
        name: a.name,
        color: a.color,
        position,
      })),
    )
    .select("id, name");
  if (areas.error) throw fail(areas.error);
  const areaId = new Map(
    demoAreas.map((a) => [
      a.key,
      areas.data.find((r) => r.name === a.name)?.id,
    ]),
  );

  const projects = await supabase
    .from("projects")
    .insert(
      demoProjects.map((p) => ({
        name: p.name,
        description: p.description || null,
        color: p.color,
        area_id: areaId.get(p.area) ?? "",
      })),
    )
    .select("id, name");
  if (projects.error) throw fail(projects.error);
  const projectId = new Map(
    demoProjects.map((p) => [
      p.key,
      projects.data.find((r) => r.name === p.name)?.id,
    ]),
  );

  const tags = await supabase
    .from("tags")
    .insert(demoTags.map((t) => ({ name: t.name, color: t.color })))
    .select("id, name");
  if (tags.error) throw fail(tags.error);
  const tagId = new Map(
    demoTags.map((t) => [t.key, tags.data.find((r) => r.name === t.name)?.id]),
  );

  const demoTasks = buildDemoTasks(todayISO());
  const tasks = await supabase
    .from("tasks")
    .insert(
      demoTasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        created_at: t.created_at,
        // Триггер оставит заданную дату выполнения, а не поставит «сейчас».
        completed_at: t.completed_at,
        recurrence: t.recurrence,
        project_id: t.project ? (projectId.get(t.project) ?? null) : null,
        area_id: t.area ? (areaId.get(t.area) ?? null) : null,
      })),
    )
    .select("id, title");
  if (tasks.error) throw fail(tasks.error);
  // Названия в демо-наборе уникальны — это проверяет demoData.test.ts.
  const taskId = new Map(tasks.data.map((r) => [r.title, r.id]));

  const links = demoTasks.flatMap((t) =>
    t.tags.flatMap((tag) => {
      const task_id = taskId.get(t.title);
      const tag_id = tagId.get(tag);
      return task_id && tag_id ? [{ task_id, tag_id }] : [];
    }),
  );
  if (links.length) {
    const { error } = await supabase.from("task_tags").insert(links);
    if (error) throw fail(error);
  }
}

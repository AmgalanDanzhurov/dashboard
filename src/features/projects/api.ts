import { progressFromRow } from "@/lib/domain/progress";
import type { Project, ProgressById } from "@/lib/domain/types";
import { getSupabase } from "@/lib/supabase/client";
import { toDataError } from "@/lib/supabase/errors";

import type { ProjectFormValues } from "./schema";

/** Все проекты, включая архивные: фильтрует интерфейс. */
export async function listProjects(): Promise<Project[]> {
  const { data, error } = await getSupabase()
    .from("projects")
    .select("*")
    .order("created_at");
  if (error) throw toDataError(error, "загрузить проекты");
  return data;
}

export async function listProjectProgress(): Promise<ProgressById> {
  const { data, error } = await getSupabase()
    .from("project_progress")
    .select("*");
  if (error) throw toDataError(error, "загрузить прогресс проектов");
  return Object.fromEntries(
    data.flatMap((row) =>
      row.project_id ? [[row.project_id, progressFromRow(row)]] : [],
    ),
  );
}

function toRow(values: ProjectFormValues) {
  return {
    name: values.name,
    description: values.description || null,
    color: values.color,
    area_id: values.areaId,
  };
}

export async function createProject(
  values: ProjectFormValues,
): Promise<Project> {
  const { data, error } = await getSupabase()
    .from("projects")
    .insert(toRow(values))
    .select()
    .single();
  if (error) throw toDataError(error, "создать проект");
  return data;
}

export async function updateProject(
  id: string,
  values: ProjectFormValues,
): Promise<void> {
  const { error } = await getSupabase()
    .from("projects")
    .update(toRow(values))
    .eq("id", id);
  if (error) throw toDataError(error, "сохранить проект");
}

export async function setProjectArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  const { error } = await getSupabase()
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) {
    throw toDataError(
      error,
      archived ? "архивировать проект" : "восстановить проект",
    );
  }
}

/** Сколько задач удалится вместе с проектом. */
export async function countProjectTasks(projectId: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);
  if (error) throw toDataError(error, "посчитать задачи");
  return count ?? 0;
}

/** Удаляет проект; его задачи удаляются каскадно в базе. */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await getSupabase().from("projects").delete().eq("id", id);
  if (error) throw toDataError(error, "удалить проект");
}

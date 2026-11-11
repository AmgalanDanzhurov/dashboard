import { progressFromRow } from "@/lib/domain/progress";
import type { Area, ProgressById } from "@/lib/domain/types";
import { getSupabase } from "@/lib/supabase/client";
import { toDataError } from "@/lib/supabase/errors";

import type { AreaFormValues } from "./schema";

export async function listAreas(): Promise<Area[]> {
  const { data, error } = await getSupabase()
    .from("areas")
    .select("*")
    .order("position")
    .order("created_at");
  if (error) throw toDataError(error, "загрузить разделы");
  return data;
}

export async function listAreaProgress(): Promise<ProgressById> {
  const { data, error } = await getSupabase().from("area_progress").select("*");
  if (error) throw toDataError(error, "загрузить прогресс разделов");
  return Object.fromEntries(
    data.flatMap((row) =>
      row.area_id ? [[row.area_id, progressFromRow(row)]] : [],
    ),
  );
}

export async function createArea(
  values: AreaFormValues & { position: number },
): Promise<Area> {
  const { data, error } = await getSupabase()
    .from("areas")
    .insert(values)
    .select()
    .single();
  if (error) throw toDataError(error, "создать раздел");
  return data;
}

export async function updateArea(
  id: string,
  values: AreaFormValues,
): Promise<void> {
  const { error } = await getSupabase()
    .from("areas")
    .update(values)
    .eq("id", id);
  if (error) throw toDataError(error, "сохранить раздел");
}

export async function saveAreaPositions(
  updates: readonly { id: string; position: number }[],
): Promise<void> {
  const results = await Promise.all(
    updates.map(({ id, position }) =>
      getSupabase().from("areas").update({ position }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error)?.error;
  if (failed) throw toDataError(failed, "изменить порядок разделов");
}

/** Сколько проектов и задач удалится вместе с разделом. */
export async function countAreaContents(
  areaId: string,
): Promise<{ projects: number; tasks: number }> {
  const supabase = getSupabase();

  const projects = await supabase
    .from("projects")
    .select("id")
    .eq("area_id", areaId);
  if (projects.error) throw toDataError(projects.error, "посчитать проекты");
  const projectIds = projects.data.map((p) => p.id);

  const direct = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("area_id", areaId);
  if (direct.error) throw toDataError(direct.error, "посчитать задачи");

  let inProjects = 0;
  if (projectIds.length > 0) {
    const res = await supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .in("project_id", projectIds);
    if (res.error) throw toDataError(res.error, "посчитать задачи");
    inProjects = res.count ?? 0;
  }

  return {
    projects: projectIds.length,
    tasks: (direct.count ?? 0) + inProjects,
  };
}

/** Удаляет раздел; проекты и задачи удаляются каскадно в базе. */
export async function deleteArea(id: string): Promise<void> {
  const { error } = await getSupabase().from("areas").delete().eq("id", id);
  if (error) throw toDataError(error, "удалить раздел");
}

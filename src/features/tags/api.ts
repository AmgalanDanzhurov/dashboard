import type { Tag } from "@/lib/domain/types";
import { getSupabase } from "@/lib/supabase/client";
import { toDataError } from "@/lib/supabase/errors";

import type { TagFormValues } from "./schema";

export async function listTags(): Promise<Tag[]> {
  const { data, error } = await getSupabase()
    .from("tags")
    .select("*")
    .order("name");
  if (error) throw toDataError(error, "загрузить теги");
  return data;
}

export async function createTag(values: TagFormValues): Promise<Tag> {
  const { data, error } = await getSupabase()
    .from("tags")
    .insert(values)
    .select()
    .single();
  if (error) throw toDataError(error, "создать тег");
  return data;
}

export async function updateTag(
  id: string,
  values: TagFormValues,
): Promise<void> {
  const { error } = await getSupabase()
    .from("tags")
    .update(values)
    .eq("id", id);
  if (error) throw toDataError(error, "сохранить тег");
}

/** Удаляет тег; связи с задачами удаляются каскадно, сами задачи остаются. */
export async function deleteTag(id: string): Promise<void> {
  const { error } = await getSupabase().from("tags").delete().eq("id", id);
  if (error) throw toDataError(error, "удалить тег");
}

import { locationColumns, type TaskLocation } from "@/lib/domain/location";
import type { Recurrence } from "@/lib/domain/recurrence";
import type {
  ISODate,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/domain/types";
import { getSupabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";
import { toDataError } from "@/lib/supabase/errors";

/** Задача вместе с её тегами одним запросом. */
const TASK_SELECT = "*, task_tags(tag_id)";

type TaskRow = Tables<"tasks"> & { task_tags: { tag_id: string }[] };

function toTask({ task_tags, ...row }: TaskRow): Task {
  return { ...row, tagIds: task_tags.map((t) => t.tag_id) };
}

export type TaskInput = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: ISODate | null;
  location: TaskLocation;
  tagIds: string[];
  /** null — задача не повторяется. */
  recurrence: Recurrence | null;
};

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw toDataError(error, "загрузить задачи");
  return data.map(toTask);
}

/** Колонки таблицы tasks; теги пишутся отдельно, в task_tags. */
function toColumns(input: TaskInput) {
  return {
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    due_date: input.due_date,
    recurrence: input.recurrence,
    ...locationColumns(input.location),
  };
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await getSupabase()
    .from("tasks")
    .insert(toColumns(input))
    .select(TASK_SELECT)
    .single();
  if (error) throw toDataError(error, "создать задачу");
  if (input.tagIds.length) await replaceTaskTags(data.id, [], input.tagIds);
  return { ...toTask(data), tagIds: input.tagIds };
}

export async function updateTask(
  task: Pick<Task, "id" | "tagIds">,
  input: TaskInput,
): Promise<void> {
  const { error } = await getSupabase()
    .from("tasks")
    .update(toColumns(input))
    .eq("id", task.id);
  if (error) throw toDataError(error, "сохранить задачу");
  await replaceTaskTags(task.id, task.tagIds, input.tagIds);
}

/** Приводит теги задачи от before к after: удаляет лишние, добавляет новые. */
async function replaceTaskTags(
  taskId: string,
  before: readonly string[],
  after: readonly string[],
): Promise<void> {
  const supabase = getSupabase();
  const removed = before.filter((id) => !after.includes(id));
  const added = after.filter((id) => !before.includes(id));

  if (removed.length) {
    const { error } = await supabase
      .from("task_tags")
      .delete()
      .eq("task_id", taskId)
      .in("tag_id", removed);
    if (error) throw toDataError(error, "сохранить теги задачи");
  }
  if (added.length) {
    const { error } = await supabase
      .from("task_tags")
      .insert(added.map((tag_id) => ({ task_id: taskId, tag_id })));
    if (error) throw toDataError(error, "сохранить теги задачи");
  }
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<void> {
  const { error } = await getSupabase()
    .from("tasks")
    .update({ status })
    .eq("id", id);
  if (error) throw toDataError(error, "изменить статус задачи");
}

export async function setTaskPriority(
  id: string,
  priority: TaskPriority,
): Promise<void> {
  const { error } = await getSupabase()
    .from("tasks")
    .update({ priority })
    .eq("id", id);
  if (error) throw toDataError(error, "изменить приоритет задачи");
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await getSupabase().from("tasks").delete().eq("id", id);
  if (error) throw toDataError(error, "удалить задачу");
}

/**
 * Выполняет экземпляр повторяющейся задачи и создаёт следующий со сроком
 * nextDue — одной транзакцией в базе. Возвращает id нового экземпляра.
 */
export async function completeRecurringTask(
  id: string,
  nextDue: ISODate,
): Promise<string> {
  const { data, error } = await getSupabase().rpc("complete_recurring_task", {
    p_task_id: id,
    p_next_due: nextDue,
  });
  if (error) throw toDataError(error, "выполнить повторяющуюся задачу");
  return data;
}

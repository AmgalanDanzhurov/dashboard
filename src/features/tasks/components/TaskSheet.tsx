"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { TagToggleList } from "@/features/tags/components/TagToggleList";
import { formatLongDate, localDateOf, todayISO } from "@/lib/domain/dates";
import { parseRecurrence } from "@/lib/domain/recurrence";
import {
  decodeLocation,
  encodeLocation,
  taskLocation,
} from "@/lib/domain/location";
import { priorities, statuses } from "@/lib/domain/taskMeta";
import type { Task, TaskPriority, TaskStatus } from "@/lib/domain/types";

import { useDeleteTask, useUpdateTask } from "../hooks";
import { fromRecurrenceForm, toRecurrenceForm } from "../recurrenceForm";
import { taskFormSchema, type TaskFormValues } from "../schema";
import type { TaskData } from "../useTaskData";

import { LocationSelect } from "./LocationSelect";
import { RecurrenceEditor } from "./RecurrenceEditor";

type Props = {
  task: Task | null;
  onClose: () => void;
  data: TaskData;
};

/** Боковая панель редактирования задачи. */
export function TaskSheet({ task, onClose, data }: Props) {
  return (
    <Sheet open={task !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {task ? (
          // key: при выборе другой задачи форма создаётся заново.
          <TaskForm key={task.id} task={task} onDone={onClose} data={data} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function TaskForm({
  task,
  onDone,
  data,
}: {
  task: Task;
  onDone: () => void;
  data: TaskData;
}) {
  const tagsLabelId = useId();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ?? "",
      location: encodeLocation(taskLocation(task)),
      tagIds: task.tagIds,
      recurrence: toRecurrenceForm(
        parseRecurrence(task.recurrence),
        task.due_date ?? todayISO(),
      ),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await updateTask.mutateAsync({
      task,
      input: {
        title: values.title,
        description: values.description || null,
        status: values.status as TaskStatus,
        priority: values.priority as TaskPriority,
        due_date: values.dueDate || null,
        location: decodeLocation(values.location),
        tagIds: values.tagIds,
        recurrence: fromRecurrenceForm(values.recurrence),
      },
    });
    onDone();
  });

  // В списке мест — активные проекты и текущий проект задачи, даже архивный.
  const selectableProjects = data.projects.filter(
    (p) => p.archived_at === null || p.id === task.project_id,
  );

  return (
    <form
      onSubmit={(e) => void onSubmit(e).catch(() => undefined)}
      noValidate
      className="flex flex-1 flex-col"
    >
      <SheetHeader>
        <SheetTitle>Задача</SheetTitle>
        <SheetDescription>
          {task.completed_at
            ? `Выполнена ${formatLongDate(localDateOf(task.completed_at))}`
            : `Создана ${formatLongDate(localDateOf(task.created_at))}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="task-title">Название</Label>
          <Input
            id="task-title"
            aria-invalid={errors.title ? true : undefined}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="task-description">Описание</Label>
          <Textarea
            id="task-description"
            rows={4}
            placeholder="Необязательно"
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-destructive">
              {errors.description.message}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-status">Статус</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-priority">Приоритет</Label>
            <Controller
              control={control}
              name="priority"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-priority" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span
                          aria-hidden
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="task-due">Срок</Label>
          <Input
            id="task-due"
            type="date"
            aria-invalid={errors.dueDate ? true : undefined}
            {...register("dueDate")}
          />
          {errors.dueDate ? (
            <p className="text-sm text-destructive">{errors.dueDate.message}</p>
          ) : null}
        </div>

        <RecurrenceEditor
          control={control}
          register={register}
          setValue={setValue}
          errors={errors}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor="task-location">Где лежит</Label>
          <Controller
            control={control}
            name="location"
            render={({ field }) => (
              <LocationSelect
                id="task-location"
                value={field.value}
                onChange={field.onChange}
                areas={data.areas}
                projects={selectableProjects}
              />
            )}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span id={tagsLabelId} className="text-sm font-medium">
            Теги
          </span>
          <Controller
            control={control}
            name="tagIds"
            render={({ field }) => (
              <TagToggleList
                tags={data.tags}
                value={field.value}
                onChange={field.onChange}
                labelledBy={tagsLabelId}
              />
            )}
          />
        </div>
      </div>

      <SheetFooter className="mt-auto flex-row justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 /> Удалить
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Сохранить
        </Button>
      </SheetFooter>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Удалить задачу «${task.title}»?`}
        description={<p>Это нельзя отменить.</p>}
        confirmLabel="Удалить задачу"
        disabled={deleteTask.isPending}
        onConfirm={() =>
          void deleteTask
            .mutateAsync(task)
            .then(onDone)
            .catch(() => undefined)
        }
      />
    </form>
  );
}

"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskLocation } from "@/lib/domain/location";
import type { ISODate } from "@/lib/domain/types";

import { useCreateTask } from "../hooks";
import { quickAddSchema } from "../schema";

type Props = {
  /** Куда попадёт новая задача. */
  location: TaskLocation;
  placeholder?: string;
  /** Сразу положить задачу в план дня на эту дату (страница «Сегодня»). */
  plannedFor?: ISODate;
};

/**
 * Быстрое добавление одной строкой: Enter или кнопка «Добавить».
 * Кнопка нужна телефонам: на клавиатурах с подсказками слов Enter часто
 * только подтверждает слово и не отправляет форму.
 */
export function QuickAddTask({
  location,
  placeholder = "Новая задача",
  plannedFor,
}: Props) {
  const [title, setTitle] = useState("");
  const createTask = useCreateTask();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = quickAddSchema.safeParse(title);
    if (!parsed.success) {
      if (title.trim()) toast.error(parsed.error.issues[0]?.message);
      return;
    }
    // Очищаем сразу, чтобы можно было печатать следующую задачу.
    setTitle("");
    try {
      await createTask.mutateAsync({
        title: parsed.data,
        description: null,
        status: "todo",
        priority: "medium",
        due_date: null,
        location,
        tagIds: [],
        recurrence: null,
        planned_for: plannedFor ?? null,
      });
    } catch {
      // Ошибку уже показал toast — возвращаем текст, чтобы не потерять его.
      setTitle(parsed.data);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Plus
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={placeholder}
          aria-label="Новая задача"
          maxLength={200}
          autoComplete="off"
          // Клавиша Enter на телефонной клавиатуре подписана «Отправить».
          enterKeyHint="send"
          className="pl-9"
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        disabled={!title.trim() || createTask.isPending}
      >
        Добавить
      </Button>
    </form>
  );
}

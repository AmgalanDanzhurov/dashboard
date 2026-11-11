"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import type { TaskLocation } from "@/lib/domain/location";

import { useCreateTask } from "../hooks";
import { quickAddSchema } from "../schema";

type Props = {
  /** Куда попадёт новая задача. */
  location: TaskLocation;
  placeholder?: string;
};

/** Быстрое добавление одной строкой: Enter — создать. */
export function QuickAddTask({
  location,
  placeholder = "Новая задача — Enter, чтобы добавить",
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
      });
    } catch {
      // Ошибку уже показал toast — возвращаем текст, чтобы не потерять его.
      setTitle(parsed.data);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="relative">
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
        className="pl-9"
      />
    </form>
  );
}

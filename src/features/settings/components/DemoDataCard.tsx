"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAreas } from "@/features/areas/hooks";
import { useTags } from "@/features/tags/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { errorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";

import { seedDemoData } from "../api";

/** Кнопка «Заполнить демо-данными» — только для пустого аккаунта. */
export function DemoDataCard() {
  const queryClient = useQueryClient();
  const areas = useAreas();
  const tasks = useTasks();
  const tags = useTags();

  const seed = useMutation({
    mutationFn: seedDemoData,
    onSuccess: () => {
      toast.success("Демо-данные добавлены");
      // Изменилось всё сразу — обновляем все запросы.
      return queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      return queryClient.invalidateQueries();
    },
  });

  const loaded = areas.data && tasks.data && tags.data;
  const empty =
    loaded &&
    areas.data.length === 0 &&
    tasks.data.length === 0 &&
    tags.data.length === 0;

  return (
    <section aria-labelledby="demo-heading" className="flex flex-col gap-3">
      <h2 id="demo-heading" className="text-lg font-semibold">
        Демо-данные
      </h2>
      <p className="max-w-prose text-sm text-muted-foreground">
        Три раздела, четыре проекта и около сорока задач, выполненных в разные
        дни последнего месяца, — чтобы сразу посмотреть на графики.
      </p>
      {seed.isSuccess ? (
        <Button asChild variant="outline" className="self-start">
          <Link href={routes.dashboard}>Открыть дашборд</Link>
        </Button>
      ) : empty ? (
        <Button
          className="self-start"
          disabled={seed.isPending}
          onClick={() => seed.mutate()}
        >
          <Sparkles aria-hidden />
          {seed.isPending ? "Добавляем…" : "Заполнить демо-данными"}
        </Button>
      ) : loaded ? (
        <p className="text-sm text-muted-foreground">
          Доступно только для пустого аккаунта: в нём уже есть разделы, задачи
          или теги.
        </p>
      ) : null}
    </section>
  );
}

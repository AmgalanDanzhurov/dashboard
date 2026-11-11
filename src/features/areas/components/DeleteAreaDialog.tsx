"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { plural, PROJECT_FORMS, TASK_FORMS } from "@/lib/domain/plural";
import type { Area } from "@/lib/domain/types";

import { useAreaContents, useDeleteArea } from "../hooks";

type Props = {
  area: Area;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteAreaDialog({
  area,
  open,
  onOpenChange,
  onDeleted,
}: Props) {
  const contents = useAreaContents(area.id, open);
  const deleteArea = useDeleteArea();

  const description = contents.data ? (
    <p>
      {contents.data.projects === 0 && contents.data.tasks === 0
        ? "Раздел пуст."
        : `Вместе с ним удалятся ${contents.data.projects} ${plural(
            contents.data.projects,
            PROJECT_FORMS,
          )} и ${contents.data.tasks} ${plural(contents.data.tasks, TASK_FORMS)}.`}{" "}
      Это нельзя отменить.
    </p>
  ) : contents.isError ? (
    <p>Не удалось посчитать, что удалится. Закройте окно и попробуйте снова.</p>
  ) : (
    <p>Считаем проекты и задачи…</p>
  );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Удалить раздел «${area.name}»?`}
      description={description}
      confirmLabel="Удалить раздел"
      // Не даём удалить, пока пользователь не увидел, что именно удалится.
      disabled={!contents.data || deleteArea.isPending}
      onConfirm={() =>
        deleteArea.mutate(area, { onSuccess: () => onDeleted?.() })
      }
    />
  );
}

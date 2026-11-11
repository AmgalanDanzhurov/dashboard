"use client";

import {
  Archive,
  ArchiveRestore,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { plural, TASK_FORMS } from "@/lib/domain/plural";
import type { Project } from "@/lib/domain/types";

import {
  useDeleteProject,
  useProjectTaskCount,
  useSetProjectArchived,
} from "../hooks";

import { ProjectFormDialog } from "./ProjectFormDialog";

type Props = {
  project: Project;
  onDeleted?: () => void;
};

export function ProjectMenu({ project, onDeleted }: Props) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const setArchived = useSetProjectArchived();
  const archived = project.archived_at !== null;

  return (
    <>
      {/* modal={false}: иначе после открытия диалога из меню страница может остаться некликабельной. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Действия с проектом «${project.name}»`}
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <Pencil /> Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={setArchived.isPending}
            onSelect={() =>
              setArchived.mutate({ project, archived: !archived })
            }
          >
            {archived ? (
              <>
                <ArchiveRestore /> Восстановить из архива
              </>
            ) : (
              <>
                <Archive /> В архив
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog("delete")}
          >
            <Trash2 /> Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormDialog
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
        project={project}
      />
      <DeleteProjectDialog
        project={project}
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        onDeleted={onDeleted}
      />
    </>
  );
}

function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onDeleted,
}: {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const count = useProjectTaskCount(project.id, open);
  const deleteProject = useDeleteProject();

  const description =
    count.data !== undefined ? (
      <p>
        {count.data === 0
          ? "В проекте нет задач."
          : `Вместе с ним удалятся ${count.data} ${plural(count.data, TASK_FORMS)}.`}{" "}
        Это нельзя отменить. Если проект просто завершён, его можно убрать в
        архив.
      </p>
    ) : count.isError ? (
      <p>Не удалось посчитать задачи. Закройте окно и попробуйте снова.</p>
    ) : (
      <p>Считаем задачи…</p>
    );

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Удалить проект «${project.name}»?`}
      description={description}
      confirmLabel="Удалить проект"
      disabled={count.data === undefined || deleteProject.isPending}
      onConfirm={() =>
        deleteProject.mutate(project, { onSuccess: () => onDeleted?.() })
      }
    />
  );
}

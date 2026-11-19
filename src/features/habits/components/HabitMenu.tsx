"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
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
import { plural } from "@/lib/domain/plural";
import type { Habit } from "@/lib/domain/types";

import { useDeleteHabit, useMoveHabit, useSetHabitArchived } from "../hooks";

import { HabitFormDialog } from "./HabitFormDialog";

const CHECK_FORMS = ["отметка", "отметки", "отметок"] as const;

type Props = {
  habit: Habit;
  /** Активные привычки в текущем порядке — для «Выше» / «Ниже». */
  siblings: Habit[];
  checkCount: number;
};

export function HabitMenu({ habit, siblings, checkCount }: Props) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const moveHabit = useMoveHabit();
  const setArchived = useSetHabitArchived();
  const deleteHabit = useDeleteHabit();
  const archived = habit.archived_at !== null;
  const index = siblings.findIndex((h) => h.id === habit.id);

  return (
    <>
      {/* modal={false}: иначе после открытия диалога из меню страница может остаться некликабельной. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Действия с привычкой «${habit.name}»`}
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <Pencil /> Редактировать
          </DropdownMenuItem>
          {!archived ? (
            <>
              <DropdownMenuItem
                disabled={index <= 0 || moveHabit.isPending}
                onSelect={() =>
                  moveHabit.mutate({
                    habits: siblings,
                    id: habit.id,
                    direction: "up",
                  })
                }
              >
                <ArrowUp /> Выше
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={
                  index === -1 ||
                  index === siblings.length - 1 ||
                  moveHabit.isPending
                }
                onSelect={() =>
                  moveHabit.mutate({
                    habits: siblings,
                    id: habit.id,
                    direction: "down",
                  })
                }
              >
                <ArrowDown /> Ниже
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuItem
            disabled={setArchived.isPending}
            onSelect={() => setArchived.mutate({ habit, archived: !archived })}
          >
            {archived ? (
              <>
                <ArchiveRestore /> Восстановить
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

      <HabitFormDialog
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
        habit={habit}
      />
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        title={`Удалить привычку «${habit.name}»?`}
        description={
          <p>
            {checkCount === 0
              ? "Отметок пока нет."
              : `Вместе с ней удалятся ${checkCount} ${plural(checkCount, CHECK_FORMS)}.`}{" "}
            Это нельзя отменить. Если привычка больше не нужна, но историю
            жалко, уберите её в архив.
          </p>
        }
        confirmLabel="Удалить привычку"
        disabled={deleteHabit.isPending}
        onConfirm={() =>
          void deleteHabit
            .mutateAsync(habit)
            .then(() => setDialog(null))
            .catch(() => undefined)
        }
      />
    </>
  );
}

"use client";

import {
  ArrowDown,
  ArrowUp,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Area } from "@/lib/domain/types";

import { useAreas, useMoveArea } from "../hooks";

import { AreaFormDialog } from "./AreaFormDialog";
import { DeleteAreaDialog } from "./DeleteAreaDialog";

type Props = {
  area: Area;
  /** Показывать «Выше» / «Ниже» (только в списке разделов). */
  reorderable?: boolean;
  onDeleted?: () => void;
};

export function AreaMenu({ area, reorderable = false, onDeleted }: Props) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const { data: areas = [] } = useAreas();
  const moveArea = useMoveArea();
  const index = areas.findIndex((a) => a.id === area.id);

  return (
    <>
      {/* modal={false}: иначе после открытия диалога из меню страница может остаться некликабельной. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Действия с разделом «${area.name}»`}
          >
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>
            <Pencil /> Редактировать
          </DropdownMenuItem>
          {reorderable ? (
            <>
              <DropdownMenuItem
                disabled={index <= 0 || moveArea.isPending}
                onSelect={() =>
                  moveArea.mutate({ areas, id: area.id, direction: "up" })
                }
              >
                <ArrowUp /> Выше
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={index === areas.length - 1 || moveArea.isPending}
                onSelect={() =>
                  moveArea.mutate({ areas, id: area.id, direction: "down" })
                }
              >
                <ArrowDown /> Ниже
              </DropdownMenuItem>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDialog("delete")}
          >
            <Trash2 /> Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AreaFormDialog
        open={dialog === "edit"}
        onOpenChange={(open) => setDialog(open ? "edit" : null)}
        area={area}
      />
      <DeleteAreaDialog
        area={area}
        open={dialog === "delete"}
        onOpenChange={(open) => setDialog(open ? "delete" : null)}
        onDeleted={onDeleted}
      />
    </>
  );
}

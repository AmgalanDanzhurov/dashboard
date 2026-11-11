"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorPicker } from "@/components/ColorPicker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nextFreeColor } from "@/lib/domain/palette";
import type { Area } from "@/lib/domain/types";

import { useAreas, useCreateArea, useUpdateArea } from "../hooks";
import { areaFormSchema, type AreaFormValues } from "../schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Если передан — редактирование, иначе создание. */
  area?: Area;
};

export function AreaFormDialog({ open, onOpenChange, area }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {area ? "Редактировать раздел" : "Новый раздел"}
          </DialogTitle>
          <DialogDescription>
            Раздел — крупная сфера жизни: учёба, работа, личное.
          </DialogDescription>
        </DialogHeader>
        {/* Форма монтируется заново при каждом открытии — поля всегда свежие. */}
        <AreaForm area={area} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AreaForm({ area, onDone }: { area?: Area; onDone: () => void }) {
  const colorLabelId = useId();
  const { data: areas = [] } = useAreas();
  const createArea = useCreateArea();
  const updateArea = useUpdateArea();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormValues>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: area?.name ?? "",
      color: area?.color ?? nextFreeColor(areas.map((a) => a.color)),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (area) await updateArea.mutateAsync({ id: area.id, values });
    else await createArea.mutateAsync({ values, areas });
    onDone();
  });

  return (
    <form
      onSubmit={(e) => void onSubmit(e).catch(() => undefined)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="area-name">Название</Label>
        <Input
          id="area-name"
          autoFocus
          placeholder="Например, Учёба"
          aria-invalid={errors.name ? true : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <span id={colorLabelId} className="text-sm font-medium">
          Цвет
        </span>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorPicker
              value={field.value}
              onChange={field.onChange}
              labelledBy={colorLabelId}
            />
          )}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {area ? "Сохранить" : "Создать"}
        </Button>
      </DialogFooter>
    </form>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAreas } from "@/features/areas/hooks";
import { defaultColor } from "@/lib/domain/palette";
import type { Project } from "@/lib/domain/types";

import { useCreateProject, useUpdateProject } from "../hooks";
import { projectFormSchema, type ProjectFormValues } from "../schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Если передан — редактирование, иначе создание. */
  project?: Project;
  /** Раздел, выбранный по умолчанию при создании. */
  defaultAreaId?: string;
};

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  defaultAreaId,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {project ? "Редактировать проект" : "Новый проект"}
          </DialogTitle>
          <DialogDescription>
            Проект — набор задач с общей целью внутри раздела.
          </DialogDescription>
        </DialogHeader>
        <ProjectForm
          project={project}
          defaultAreaId={defaultAreaId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function ProjectForm({
  project,
  defaultAreaId,
  onDone,
}: {
  project?: Project;
  defaultAreaId?: string;
  onDone: () => void;
}) {
  const colorLabelId = useId();
  const { data: areas = [] } = useAreas();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name ?? "",
      description: project?.description ?? "",
      color:
        project?.color ??
        areas.find((a) => a.id === defaultAreaId)?.color ??
        defaultColor,
      areaId: project?.area_id ?? defaultAreaId ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (project) await updateProject.mutateAsync({ id: project.id, values });
    else await createProject.mutateAsync(values);
    onDone();
  });

  return (
    <form
      onSubmit={(e) => void onSubmit(e).catch(() => undefined)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="project-name">Название</Label>
        <Input
          id="project-name"
          autoFocus
          placeholder="Например, Курсовая работа"
          aria-invalid={errors.name ? true : undefined}
          {...register("name")}
        />
        {errors.name ? (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-description">Описание</Label>
        <Textarea
          id="project-description"
          rows={3}
          placeholder="Необязательно"
          aria-invalid={errors.description ? true : undefined}
          {...register("description")}
        />
        {errors.description ? (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="project-area">Раздел</Label>
        <Controller
          control={control}
          name="areaId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="project-area"
                className="w-full"
                aria-invalid={errors.areaId ? true : undefined}
              >
                <SelectValue placeholder="Выберите раздел" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.areaId ? (
          <p className="text-sm text-destructive">{errors.areaId.message}</p>
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
          {project ? "Сохранить" : "Создать"}
        </Button>
      </DialogFooter>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { ColorPicker } from "@/components/ColorPicker";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { QueryError } from "@/components/QueryError";
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
import { Skeleton } from "@/components/ui/skeleton";
import { nextFreeColor } from "@/lib/domain/palette";
import type { Tag } from "@/lib/domain/types";

import { useCreateTag, useDeleteTag, useTags, useUpdateTag } from "../hooks";
import { tagFormSchema, type TagFormValues } from "../schema";

/** Управление тегами в настройках: создание, переименование, цвет, удаление. */
export function TagManager() {
  const tags = useTags();
  const [editing, setEditing] = useState<Tag | "new" | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const deleteTag = useDeleteTag();

  return (
    <section aria-labelledby="tags-heading" className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 id="tags-heading" className="mr-auto text-lg font-semibold">
          Теги
        </h2>
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus /> Новый тег
        </Button>
      </div>

      {tags.isPending ? (
        <Skeleton className="h-24 w-full" />
      ) : tags.isError ? (
        <QueryError error={tags.error} onRetry={() => void tags.refetch()} />
      ) : tags.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Тегов пока нет. Теги помогают отмечать задачи поперёк разделов —
          например, «чтение» или «звонки».
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {tags.data.map((tag) => (
            <li key={tag.id} className="flex items-center gap-3 px-4 py-2">
              <span
                aria-hidden
                className="size-2.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <span className="min-w-0 flex-1 break-words">{tag.name}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Изменить тег «${tag.name}»`}
                onClick={() => setEditing(tag)}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Удалить тег «${tag.name}»`}
                onClick={() => setDeleting(tag)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Новый тег" : "Изменить тег"}
            </DialogTitle>
            <DialogDescription>
              Имя тега должно быть уникальным.
            </DialogDescription>
          </DialogHeader>
          {editing ? (
            <TagForm
              tag={editing === "new" ? undefined : editing}
              usedColors={(tags.data ?? []).map((t) => t.color)}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Удалить тег «${deleting.name}»?`}
          description={
            <p>Тег снимется со всех задач, сами задачи останутся.</p>
          }
          confirmLabel="Удалить тег"
          disabled={deleteTag.isPending}
          onConfirm={() =>
            void deleteTag
              .mutateAsync(deleting)
              .then(() => setDeleting(null))
              .catch(() => undefined)
          }
        />
      ) : null}
    </section>
  );
}

function TagForm({
  tag,
  usedColors,
  onDone,
}: {
  tag?: Tag;
  usedColors: string[];
  onDone: () => void;
}) {
  const colorLabelId = useId();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name ?? "",
      color: tag?.color ?? nextFreeColor(usedColors),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (tag) await updateTag.mutateAsync({ id: tag.id, values });
    else await createTag.mutateAsync(values);
    onDone();
  });

  return (
    <form
      onSubmit={(e) => void onSubmit(e).catch(() => undefined)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="tag-name">Название</Label>
        <Input
          id="tag-name"
          autoFocus
          placeholder="Например, чтение"
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
          {tag ? "Сохранить" : "Создать"}
        </Button>
      </DialogFooter>
    </form>
  );
}

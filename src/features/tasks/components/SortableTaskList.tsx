"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { planMove } from "@/lib/domain/manualOrder";
import type { Task } from "@/lib/domain/types";

import { useReorderTasks } from "../hooks";
import type { TaskData } from "../useTaskData";

import { TaskRow } from "./TaskRow";

type Props = {
  /** Невыполненные задачи в своём порядке. */
  tasks: readonly Task[];
  data: TaskData;
  showLocation: boolean;
  onOpen: (task: Task) => void;
};

/**
 * Список «Свой порядок»: задачи перетаскиваются за ручку слева — мышью,
 * пальцем или с клавиатуры (Пробел — взять, стрелки — двигать, Пробел —
 * положить, Esc — отменить).
 */
export function SortableTaskList({ tasks, data, showLocation, onOpen }: Props) {
  const reorder = useReorderTasks();
  const sensors = useSensors(
    // Сдвиг на 5 px до начала перетаскивания: обычное касание остаётся касанием.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const titleOf = (id: string | number) =>
    tasks.find((t) => t.id === id)?.title ?? "задача";
  const positionOf = (id: string | number) =>
    tasks.findIndex((t) => t.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Задача «${titleOf(active.id)}» взята, место ${positionOf(active.id)} из ${tasks.length}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `Задача «${titleOf(active.id)}» над местом ${positionOf(over.id)} из ${tasks.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Задача «${titleOf(active.id)}» поставлена на место ${positionOf(over.id)}.`
        : `Задача «${titleOf(active.id)}» отпущена.`,
    onDragCancel: ({ active }) =>
      `Перетаскивание отменено, задача «${titleOf(active.id)}» на прежнем месте.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const updates = planMove(tasks, String(active.id), String(over.id));
    if (updates.length) reorder.mutate(updates);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Чтобы переставить задачу, нажмите Пробел, двигайте стрелками вверх и вниз, снова нажмите Пробел, чтобы поставить, или Esc, чтобы отменить.",
        },
      }}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="divide-y">
          {tasks.map((task) => (
            <SortableRow
              key={task.id}
              task={task}
              data={data}
              showLocation={showLocation}
              onOpen={onOpen}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  task,
  data,
  showLocation,
  onOpen,
}: {
  task: Task;
  data: TaskData;
  showLocation: boolean;
  onOpen: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <TaskRow
      task={task}
      data={data}
      showLocation={showLocation}
      onOpen={onOpen}
      rowRef={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      dragging={isDragging}
      dragHandle={
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Переставить «${task.title}»`}
          // touch-none: иначе на телефоне палец будет прокручивать страницу.
          className="-ml-1 flex h-6 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
      }
    />
  );
}

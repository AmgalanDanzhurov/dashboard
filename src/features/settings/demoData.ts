import { addDaysISO } from "@/lib/domain/dates";
import { getNextDueDate, type Recurrence } from "@/lib/domain/recurrence";
import type { ISODate, TaskPriority, TaskStatus } from "@/lib/domain/types";

// Демо-данные: чтобы сразу увидеть графики, а не пустые экраны.
// Описаны декларативно, даты считаются от «сегодня» при заполнении.

type AreaKey = "study" | "work" | "life";
type ProjectKey = "thesis" | "english" | "report" | "move";
type TagKey = "reading" | "calls" | "shopping";

export const demoAreas: { key: AreaKey; name: string; color: string }[] = [
  { key: "study", name: "Учёба", color: "#3b82f6" },
  { key: "work", name: "Работа", color: "#ea580c" },
  { key: "life", name: "Личное", color: "#16a34a" },
];

export const demoProjects: {
  key: ProjectKey;
  area: AreaKey;
  name: string;
  description: string;
  color: string;
}[] = [
  {
    key: "thesis",
    area: "study",
    name: "Курсовая работа",
    description: "Сдать до конца семестра.",
    color: "#6366f1",
  },
  {
    key: "english",
    area: "study",
    name: "Английский B2",
    description: "Подготовка к экзамену.",
    color: "#0891b2",
  },
  {
    key: "report",
    area: "work",
    name: "Квартальный отчёт",
    description: "Итоги квартала для руководителя.",
    color: "#ea580c",
  },
  {
    key: "move",
    area: "life",
    name: "Переезд",
    description: "",
    color: "#c026d3",
  },
];

export const demoTags: { key: TagKey; name: string; color: string }[] = [
  { key: "reading", name: "чтение", color: "#9333ea" },
  { key: "calls", name: "звонки", color: "#0d9488" },
  { key: "shopping", name: "покупки", color: "#b7800a" },
];

type Where = ProjectKey | `area:${AreaKey}` | "inbox";

/**
 * [название, где лежит, статус, приоритет, срок (дней от сегодня),
 *  создана дней назад, выполнена дней назад, теги, правило повтора]
 */
type Row = [
  title: string,
  where: Where,
  status: TaskStatus,
  priority: TaskPriority,
  due: number | null,
  createdAgo: number,
  completedAgo: number | null,
  tags?: TagKey[],
  recurrence?: Recurrence,
];

const rows: Row[] = [
  // Курсовая работа
  ["Выбрать тему", "thesis", "done", "medium", null, 28, 26],
  ["Собрать литературу", "thesis", "done", "medium", null, 26, 22, ["reading"]],
  ["Составить план", "thesis", "done", "high", null, 24, 20],
  ["Написать введение", "thesis", "done", "medium", null, 20, 15],
  [
    "Глава 1: обзор литературы",
    "thesis",
    "done",
    "high",
    null,
    18,
    10,
    ["reading"],
  ],
  ["Глава 2: методика", "thesis", "in_progress", "high", 3, 12, null],
  ["Глава 3: результаты", "thesis", "todo", "medium", 10, 10, null],
  ["Оформить список литературы", "thesis", "todo", "low", null, 8, null],
  [
    "Согласовать план с руководителем",
    "thesis",
    "todo",
    "urgent",
    -1,
    6,
    null,
    ["calls"],
  ],
  // Английский B2
  ["Unit 1: Present tenses", "english", "done", "medium", null, 29, 27],
  ["Unit 2: Past tenses", "english", "done", "medium", null, 25, 21],
  ["Unit 3: Future forms", "english", "done", "medium", null, 21, 14],
  ["Пробный тест", "english", "done", "high", null, 15, 8],
  ["Unit 4: Conditionals", "english", "in_progress", "medium", 0, 7, null],
  [
    "Прочитать статью на английском",
    "english",
    "todo",
    "low",
    2,
    5,
    null,
    ["reading"],
  ],
  ["Записаться на экзамен", "english", "todo", "high", 6, 4, null, ["calls"]],
  // Квартальный отчёт
  ["Выгрузить данные за квартал", "report", "done", "medium", null, 27, 25],
  [
    "Сверить цифры с бухгалтерией",
    "report",
    "done",
    "high",
    null,
    24,
    19,
    ["calls"],
  ],
  ["Построить графики", "report", "done", "medium", null, 19, 12],
  ["Черновик выводов", "report", "done", "high", null, 14, 6],
  [
    "Показать черновик коллегам",
    "report",
    "done",
    "medium",
    null,
    9,
    3,
    ["calls"],
  ],
  ["Финальная версия отчёта", "report", "in_progress", "urgent", 1, 5, null],
  ["Презентация на 10 слайдов", "report", "todo", "high", 4, 4, null],
  ["Разослать отчёт", "report", "todo", "medium", 5, 3, null],
  [
    "Еженедельная сводка",
    "report",
    "todo",
    "medium",
    null,
    20,
    null,
    [],
    { type: "weekly", weekdays: [5] },
  ],
  // Переезд
  ["Найти квартиру", "move", "done", "high", null, 30, 23],
  ["Подписать договор аренды", "move", "done", "urgent", null, 23, 17],
  ["Заказать коробки", "move", "done", "medium", null, 17, 11, ["shopping"]],
  ["Упаковать книги", "move", "done", "low", null, 12, 5, ["reading"]],
  ["Вызвать грузчиков", "move", "todo", "high", -2, 8, null, ["calls"]],
  ["Переоформить интернет", "move", "todo", "medium", 7, 6, null, ["calls"]],
  ["Купить шторы", "move", "todo", "low", null, 2, null, ["shopping"]],
  // Прямо в разделах, без проекта
  [
    "Продлить читательский билет",
    "area:study",
    "done",
    "low",
    null,
    10,
    9,
    ["reading"],
  ],
  ["Купить тетради", "area:study", "todo", "low", 3, 3, null, ["shopping"]],
  ["Обновить резюме", "area:work", "todo", "low", null, 15, null],
  ["Настроить почту на телефоне", "area:work", "done", "low", null, 13, 12],
  [
    "Зарядка",
    "area:life",
    "todo",
    "medium",
    null,
    25,
    null,
    [],
    { type: "daily" },
  ],
  [
    "Записаться к стоматологу",
    "area:life",
    "todo",
    "medium",
    2,
    4,
    null,
    ["calls"],
  ],
  ["Оплатить коммуналку", "area:life", "done", "high", null, 6, 1],
  // Входящие
  ["Разобрать загрузки", "inbox", "todo", "low", null, 2, null],
  ["Посмотреть курс по дизайну", "inbox", "todo", "low", null, 1, null],
  ["Вернуть книгу другу", "inbox", "done", "medium", null, 5, 0, ["reading"]],
];

export type DemoTask = {
  title: string;
  project: ProjectKey | null;
  area: AreaKey | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: ISODate | null;
  created_at: string;
  completed_at: string | null;
  recurrence: Recurrence | null;
  tags: TagKey[];
};

/**
 * Полдень дня, который был daysAgo дней назад, по местному времени. Но не
 * позже now: если сейчас утро, «выполнено сегодня» не может быть в 12:00.
 */
function pastNoon(today: ISODate, daysAgo: number, now: Date): string {
  const [y, m, d] = addDaysISO(today, -daysAgo).split("-").map(Number);
  const noon = new Date(y, m - 1, d, 12);
  return (noon < now ? noon : now).toISOString();
}

/** Задачи демо-набора с датами относительно today. */
export function buildDemoTasks(
  today: ISODate,
  now: Date = new Date(),
): DemoTask[] {
  return rows.map(
    ([
      title,
      where,
      status,
      priority,
      due,
      createdAgo,
      completedAgo,
      tags,
      recurrence,
    ]) => ({
      title,
      project:
        where === "inbox" || where.startsWith("area:")
          ? null
          : (where as ProjectKey),
      area: where.startsWith("area:") ? (where.slice(5) as AreaKey) : null,
      status,
      priority,
      // Повторяющейся задаче нужен срок: ближайшая дата по её правилу.
      due_date: recurrence
        ? getNextDueDate(
            recurrence,
            addDaysISO(today, -1),
            addDaysISO(today, -1),
          )
        : due === null
          ? null
          : addDaysISO(today, due),
      created_at: pastNoon(today, createdAgo, now),
      completed_at:
        completedAgo === null ? null : pastNoon(today, completedAgo, now),
      recurrence: recurrence ?? null,
      tags: tags ?? [],
    }),
  );
}

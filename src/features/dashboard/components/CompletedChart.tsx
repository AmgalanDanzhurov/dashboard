"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatDue } from "@/lib/domain/dates";
import { plural, TASK_FORMS } from "@/lib/domain/plural";
import type { ISODate } from "@/lib/domain/types";

const config = {
  count: { label: "Выполнено", color: "var(--chart-1)" },
} satisfies ChartConfig;

type Props = {
  days: { date: ISODate; count: number }[];
  today: ISODate;
};

/** Столбчатый график «Выполнено за 14 дней»: одна серия, легенда не нужна. */
export function CompletedChart({ days, today }: Props) {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const data = days.map((d) => ({
    ...d,
    // На оси — число месяца, в подсказке — полная дата.
    day: String(Number(d.date.slice(8, 10))),
    label: d.date === today ? "Сегодня" : formatDue(d.date, today),
  }));

  return (
    <section
      aria-labelledby="completed-heading"
      className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="completed-heading" className="font-medium">
          Выполнено за 14 дней
        </h2>
        <span className="text-sm text-muted-foreground tabular-nums">
          {total} {plural(total, TASK_FORMS)}
        </span>
      </div>

      <ChartContainer
        config={config}
        className="aspect-auto h-48 w-full"
        aria-hidden
      >
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                labelKey="label"
                labelFormatter={(_, payload) =>
                  payload[0]?.payload?.label ?? ""
                }
              />
            }
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ChartContainer>

      {/* Те же данные для скринридера: график выше — только картинка. */}
      <table className="sr-only">
        <caption>Выполнено задач по дням</caption>
        <thead>
          <tr>
            <th scope="col">День</th>
            <th scope="col">Выполнено</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.label}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/**
 * Палитра цветов разделов, проектов и тегов. Один и тот же hex используется
 * в обеих темах, поэтому каждый цвет подобран со средней яркостью: он
 * заметен (контраст не ниже 3:1) и на белом фоне, и на тёмном.
 * Это проверяет palette.test.ts.
 */
export const palette = [
  { hex: "#6366f1", name: "Индиго" },
  { hex: "#3b82f6", name: "Синий" },
  { hex: "#0891b2", name: "Бирюзовый" },
  { hex: "#0d9488", name: "Морской" },
  { hex: "#16a34a", name: "Зелёный" },
  { hex: "#b7800a", name: "Горчичный" },
  { hex: "#ea580c", name: "Оранжевый" },
  { hex: "#e11d48", name: "Малиновый" },
  { hex: "#c026d3", name: "Фуксия" },
  { hex: "#9333ea", name: "Фиолетовый" },
  { hex: "#64748b", name: "Серый" },
] as const;

export type PaletteColor = (typeof palette)[number]["hex"];

/** Цвет по умолчанию для новых разделов и проектов (совпадает с default в БД). */
export const defaultColor: PaletteColor = "#6366f1";

export function isPaletteColor(value: string): value is PaletteColor {
  return palette.some((c) => c.hex === value);
}

/** Цвет, который ещё не занят, — чтобы новые разделы не сливались. */
export function nextFreeColor(used: readonly string[]): PaletteColor {
  return palette.find((c) => !used.includes(c.hex))?.hex ?? defaultColor;
}

export function colorName(hex: string): string {
  return palette.find((c) => c.hex === hex)?.name ?? hex;
}

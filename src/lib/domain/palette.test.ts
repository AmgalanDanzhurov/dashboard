import { describe, expect, it } from "vitest";

import {
  defaultColor,
  isPaletteColor,
  nextFreeColor,
  palette,
} from "./palette";

// Относительная яркость и контраст по WCAG 2.
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Фоны карточек из globals.css: белый и oklch(0.205 0 0) ≈ #171717.
const LIGHT_BG = "#ffffff";
const DARK_BG = "#171717";

describe("palette", () => {
  it.each(palette)(
    "$name ($hex) заметен на светлом и тёмном фоне",
    ({ hex }) => {
      // 3:1 — минимум WCAG для графических элементов (полосы, точки, кольца).
      expect(contrast(hex, LIGHT_BG)).toBeGreaterThanOrEqual(3);
      expect(contrast(hex, DARK_BG)).toBeGreaterThanOrEqual(3);
    },
  );

  it("цвета не повторяются", () => {
    expect(new Set(palette.map((c) => c.hex)).size).toBe(palette.length);
  });

  it("цвета по умолчанию из БД есть в палитре", () => {
    expect(isPaletteColor(defaultColor)).toBe(true);
    expect(isPaletteColor("#64748b")).toBe(true);
  });
});

describe("nextFreeColor", () => {
  it("берёт первый незанятый цвет", () => {
    expect(nextFreeColor([])).toBe(palette[0].hex);
    expect(nextFreeColor([palette[0].hex])).toBe(palette[1].hex);
  });

  it("когда заняты все, возвращает цвет по умолчанию", () => {
    expect(nextFreeColor(palette.map((c) => c.hex))).toBe(defaultColor);
  });
});

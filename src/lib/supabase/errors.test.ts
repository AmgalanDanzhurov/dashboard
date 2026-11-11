import { describe, expect, it } from "vitest";

import { toDataError } from "./errors";

describe("toDataError", () => {
  it("называет действие, которое не удалось", () => {
    expect(toDataError({ code: "XX000" }, "сохранить раздел").message).toBe(
      "Не удалось сохранить раздел. Попробуйте ещё раз.",
    );
  });

  it("распознаёт нарушения ограничений", () => {
    expect(toDataError({ code: "23505" }, "создать тег").message).toMatch(
      /такое имя уже есть/,
    );
    expect(toDataError({ code: "23514" }, "создать раздел").message).toMatch(
      /длину названия/,
    );
  });

  it("распознаёт сбой сети и отказ в доступе", () => {
    expect(
      toDataError({ message: "TypeError: Failed to fetch" }, "загрузить")
        .message,
    ).toMatch(/Нет связи/);
    expect(toDataError({ code: "42501" }, "загрузить").message).toMatch(
      /нет доступа/,
    );
  });
});

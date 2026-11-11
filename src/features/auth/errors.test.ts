import { describe, expect, it } from "vitest";

import { AppError, errorMessage } from "@/lib/errors";

import { toSignInError } from "./errors";

describe("toSignInError", () => {
  it("неверный пароль", () => {
    expect(
      toSignInError({ code: "invalid_credentials", status: 400 }).message,
    ).toBe("Неверный email или пароль.");
  });

  it("слишком много попыток", () => {
    expect(toSignInError({ status: 429 }).message).toMatch(/Слишком много/);
    expect(toSignInError({ code: "over_request_rate_limit" }).message).toMatch(
      /Слишком много/,
    );
  });

  it("нет сети", () => {
    expect(
      toSignInError({ name: "AuthRetryableFetchError", status: 0 }).message,
    ).toMatch(/Нет связи/);
  });

  it("неизвестная ошибка", () => {
    expect(toSignInError({ code: "something_new" }).message).toBe(
      "Не удалось войти. Попробуйте ещё раз.",
    );
  });
});

describe("errorMessage", () => {
  it("показывает текст AppError и прячет остальные", () => {
    expect(errorMessage(new AppError("Понятный текст"))).toBe("Понятный текст");
    expect(errorMessage(new Error("TypeError: x is undefined"))).toMatch(
      /Что-то пошло не так/,
    );
  });
});

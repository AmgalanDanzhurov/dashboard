/** Ошибка с понятным русским сообщением, которое можно показать пользователю. */
export class AppError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "AppError";
  }
}

/** Достаёт сообщение для пользователя из любой ошибки. */
export function errorMessage(error: unknown): string {
  return error instanceof AppError
    ? error.message
    : "Что-то пошло не так. Попробуйте ещё раз.";
}

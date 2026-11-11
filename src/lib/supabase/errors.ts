import { AppError } from "@/lib/errors";

/** Поля ошибки PostgREST / supabase-js, по которым выбираем сообщение. */
type DataErrorLike = {
  code?: string;
  message?: string;
};

/**
 * Переводит ошибку запроса к базе в AppError.
 * @param action что не получилось, в инфинитиве: «сохранить раздел».
 */
export function toDataError(error: DataErrorLike, action: string): AppError {
  return new AppError(dataErrorMessage(error, action), { cause: error });
}

function dataErrorMessage({ code, message }: DataErrorLike, action: string) {
  // supabase-js кладёт сетевой сбой в message, без кода Postgres.
  if (!code && /fetch|network/i.test(message ?? "")) {
    return "Нет связи с сервером. Проверьте интернет и попробуйте снова.";
  }
  if (code === "23505") return `Не удалось ${action}: такое имя уже есть.`;
  if (code === "23514") {
    return `Не удалось ${action}: проверьте длину названия.`;
  }
  // Истекла сессия или нет прав: RLS не пустил запрос.
  if (code === "42501" || code === "PGRST301") {
    return `Не удалось ${action}: нет доступа. Войдите заново.`;
  }
  return `Не удалось ${action}. Попробуйте ещё раз.`;
}

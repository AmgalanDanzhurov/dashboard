import { AppError } from "@/lib/errors";

/** Поля ошибки Supabase Auth, по которым выбираем сообщение. */
type AuthErrorLike = {
  name?: string;
  code?: string;
  status?: number;
};

/** Переводит ошибку входа Supabase в AppError с русским сообщением. */
export function toSignInError(error: AuthErrorLike): AppError {
  return new AppError(signInMessage(error), { cause: error });
}

function signInMessage({ name, code, status }: AuthErrorLike): string {
  if (code === "invalid_credentials") return "Неверный email или пароль.";
  if (code === "email_not_confirmed") return "Email ещё не подтверждён.";
  if (status === 429 || code?.startsWith("over_")) {
    return "Слишком много попыток. Подождите минуту и попробуйте снова.";
  }
  // supabase-js бросает AuthRetryableFetchError, когда сервер недоступен.
  if (name === "AuthRetryableFetchError" || status === 0) {
    return "Нет связи с сервером. Проверьте интернет и попробуйте снова.";
  }
  return "Не удалось войти. Попробуйте ещё раз.";
}

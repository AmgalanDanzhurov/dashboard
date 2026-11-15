"use client";

import { Button } from "@/components/ui/button";

// Ловит непредвиденные ошибки отрисовки страниц после входа. Ошибки запросов
// к базе сюда не доходят — их показывают сами страницы с кнопкой «Повторить».
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">
        Что-то пошло не так
      </h1>
      <p className="max-w-prose text-muted-foreground">
        Страница не смогла отрисоваться. Попробуйте ещё раз; если ошибка
        повторяется, перезагрузите страницу.
      </p>
      {process.env.NODE_ENV === "development" && error instanceof Error ? (
        <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-3 text-xs">
          {error.message}
        </pre>
      ) : null}
      <Button onClick={() => retry()}>Попробовать снова</Button>
    </div>
  );
}

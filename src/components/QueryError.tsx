"use client";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";

/** Ошибка загрузки данных с кнопкой повтора. */
export function QueryError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-destructive/40 p-4"
    >
      <p className="text-sm">{errorMessage(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Повторить
      </Button>
    </div>
  );
}

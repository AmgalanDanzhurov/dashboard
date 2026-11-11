"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/errors";
import { routes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { signOut } from "../api";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await signOut();
      // Кэш запросов хранит данные аккаунта — после выхода он не нужен.
      queryClient.clear();
      // Сразу на вход, без ?next=: после выхода возвращаться некуда.
      router.replace(routes.login);
    } catch (error) {
      toast.error(errorMessage(error));
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      className={cn("justify-start gap-3", className)}
      onClick={handleClick}
      disabled={pending}
    >
      <LogOut className="size-4" aria-hidden />
      Выйти
    </Button>
  );
}

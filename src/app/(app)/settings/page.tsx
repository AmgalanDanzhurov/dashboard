import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

export const metadata: Metadata = { title: "Настройки" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Настройки"
      description="Теги, тема и демо-данные — этапы 5 и 9."
    >
      {/* На телефоне боковой панели нет, поэтому выход доступен здесь. */}
      <SignOutButton className="-ml-3" />
    </PagePlaceholder>
  );
}

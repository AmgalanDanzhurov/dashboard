import type { Metadata } from "next";

import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Настройки" };

export default function SettingsPage() {
  return (
    <PagePlaceholder
      title="Настройки"
      description="Теги, тема, демо-данные и выход — этапы 3, 5 и 9."
    />
  );
}

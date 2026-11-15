import type { Metadata } from "next";

import { SignOutButton } from "@/features/auth/components/SignOutButton";
import { DemoDataCard } from "@/features/settings/components/DemoDataCard";
import { ThemeSwitch } from "@/features/settings/components/ThemeSwitch";
import { TagManager } from "@/features/tags/components/TagManager";

export const metadata: Metadata = { title: "Настройки" };

export default function SettingsPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>

      <ThemeSwitch />

      <TagManager />

      <DemoDataCard />

      <section
        aria-labelledby="account-heading"
        className="flex flex-col gap-2"
      >
        <h2 id="account-heading" className="text-lg font-semibold">
          Аккаунт
        </h2>
        {/* На телефоне боковой панели нет, поэтому выход доступен здесь. */}
        <SignOutButton className="-ml-3 self-start" />
      </section>
    </div>
  );
}

import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

// Каркас всех страниц после входа: боковая панель на десктопе, нижняя — на телефоне.
// AuthGuard обернёт его на этапе 3.
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}

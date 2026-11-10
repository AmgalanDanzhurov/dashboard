"use client";

import { ThemeProvider } from "next-themes";

// Здесь же на следующих этапах появятся QueryClientProvider и AuthProvider.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}

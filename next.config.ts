import type { NextConfig } from "next";

// Для репозитория <user>.github.io/<repo> это "/<repo>", локально — пустая строка.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // GitHub Pages отдаёт только статику: собираем сайт в out/ без сервера.
  output: "export",
  images: { unoptimized: true },
  // /tasks → /tasks/index.html: так GitHub Pages находит страницы без rewrites.
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  // Значок dev-сервера сверху: внизу он закрывал «Выйти» и «Ещё».
  devIndicators: { position: "top-right" },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

"use client";

import { useEffect } from "react";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { trpc } from "@/app/_trpc/client";

type Theme = "light" | "dark" | "system";

const applyTheme = (theme: Theme) => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle(
    "dark",
    theme === "dark" || (theme === "system" && prefersDark)
  );
};

export default function ThemeSync() {
  const { isAuthenticated } = useKindeBrowserClient();
  const { data } = trpc.getUserSettings.useQuery(undefined, {
    enabled: Boolean(isAuthenticated),
    retry: false,
  });

  useEffect(() => {
    const storedTheme = localStorage.getItem("abitso-theme") as Theme | null;
    const theme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : "light";
    applyTheme(theme);
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      if (theme === "system") applyTheme(theme);
    };
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, []);

  useEffect(() => {
    const theme = data?.theme;
    if (theme !== "light" && theme !== "dark" && theme !== "system") return;

    localStorage.setItem("abitso-theme", theme);
    applyTheme(theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      if (theme === "system") applyTheme(theme);
    };
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => mediaQuery.removeEventListener("change", updateSystemTheme);
  }, [data?.theme]);

  return null;
}

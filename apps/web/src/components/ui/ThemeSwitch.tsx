"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button, type ButtonProps } from "@workspace/ui/components/button";

function ThemeSwitch(props: ButtonProps) {
  const { setTheme, theme, systemTheme } = useTheme();

  const currentTheme = theme === "system" ? systemTheme : theme;

  const toggleTheme = () =>
    setTheme(currentTheme === "dark" ? "light" : "dark");

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full"
      {...props}
      onClick={toggleTheme}
    >
      {currentTheme === "dark" ? (
        <Moon className="text-white" />
      ) : (
        <Sun className="text-black" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default ThemeSwitch;

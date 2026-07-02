/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon } from "lucide-react";
import { motion } from "motion/react";
import { Theme } from "../types";

interface ThemeToggleProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

export default function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => onChange(isDark ? "light" : "dark")}
      className="relative flex items-center h-9 w-16 p-1 rounded-full cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-200 dark:bg-slate-800"
      aria-label="Toggle theme"
    >
      <div className="absolute left-1.5 flex items-center justify-center text-amber-500 dark:text-slate-500 transition-colors duration-300">
        <Sun size={14} className="stroke-[2.5]" />
      </div>
      <div className="absolute right-1.5 flex items-center justify-center text-zinc-400 dark:text-blue-400 transition-colors duration-300">
        <Moon size={14} className="stroke-[2.5]" />
      </div>
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="z-10 w-7 h-7 rounded-full bg-white dark:bg-slate-950 shadow-md flex items-center justify-center"
        style={{
          marginLeft: isDark ? "1.75rem" : "0px",
        }}
      >
        {isDark ? (
          <Moon size={12} className="text-blue-400 fill-blue-400/20 stroke-[2.5]" />
        ) : (
          <Sun size={12} className="text-amber-500 fill-amber-500/20 stroke-[2.5]" />
        )}
      </motion.div>
    </button>
  );
}

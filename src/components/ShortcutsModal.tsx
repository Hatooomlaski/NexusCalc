/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Keyboard } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutRow {
  key: string;
  action: string;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const categories: { title: string; shortcuts: ShortcutRow[] }[] = [
    {
      title: "Basic Operations",
      shortcuts: [
        { key: "0 - 9", action: "Number Digits" },
        { key: ".", action: "Decimal point" },
        { key: "+, -, *, /", action: "Arithmetic operators" },
        { key: "Enter / =", action: "Evaluate (Equals)" },
        { key: "Backspace", action: "Delete last character" },
        { key: "Escape", action: "Reset Calculator (All Clear)" },
      ],
    },
    {
      title: "Advanced Math & Constants",
      shortcuts: [
        { key: "(   and   )", action: "Parentheses" },
        { key: "%", action: "Percentage" },
        { key: "^", action: "Exponentiation" },
        { key: "p / P", action: "Pi constant (π)" },
        { key: "e / E", action: "Euler's constant (e)" },
      ],
    },
    {
      title: "Scientific Functions",
      shortcuts: [
        { key: "s / S", action: "Sine (sin)" },
        { key: "c / C", action: "Cosine (cos)" },
        { key: "t / T", action: "Tangent (tan)" },
        { key: "q / Q", action: "Square Root (√)" },
        { key: "l / L", action: "Natural Log (ln)" },
        { key: "g / G", action: "Base-10 Log (log)" },
      ],
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              id="shortcuts-modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.35 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-slate-800 bg-zinc-50 dark:bg-slate-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-lg text-zinc-800 dark:text-white">Keyboard Shortcuts</h3>
                </div>
                <button
                  id="close-shortcuts-modal-btn"
                  onClick={onClose}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-slate-800 text-zinc-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Grid Content */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.title} className="space-y-3">
                    <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {category.title}
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {category.shortcuts.map((shortcut, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-slate-900/60 rounded-xl border border-zinc-100 dark:border-slate-800/40"
                        >
                          <span className="text-sm font-medium text-zinc-700 dark:text-slate-300">
                            {shortcut.action}
                          </span>
                          <kbd className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg text-zinc-800 dark:text-slate-200 shadow-sm min-w-10 text-center">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 bg-zinc-50 dark:bg-slate-900/40 border-t border-zinc-100 dark:border-slate-800 text-center text-xs text-zinc-400 dark:text-slate-500">
                You can press any mapped key at any time to execute the command directly.
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

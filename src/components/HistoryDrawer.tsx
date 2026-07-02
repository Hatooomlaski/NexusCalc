/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Trash2, Clock, CornerDownLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { HistoryItem } from "../types";
import { formatFormulaForDisplay } from "../utils/mathEngine";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onClearAll: () => void;
  onDeleteItem: (id: string) => void;
  onSelectExpression: (expression: string, result: string) => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onClearAll,
  onDeleteItem,
  onSelectExpression,
}: HistoryDrawerProps) {
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

          {/* Drawer Panel */}
          <motion.div
            id="history-drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-slate-950 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-slate-800 flex items-center justify-between bg-zinc-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg text-zinc-800 dark:text-white">Calculation History</h3>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    id="clear-all-history-btn"
                    onClick={onClearAll}
                    className="p-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear All History"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
                <button
                  id="close-history-drawer-btn"
                  onClick={onClose}
                  className="p-1.5 hover:bg-zinc-200 dark:hover:bg-slate-800 text-zinc-500 dark:text-slate-400 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 dark:text-slate-600 py-10">
                  <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-slate-900 flex items-center justify-center mb-4 border border-zinc-200 dark:border-slate-800">
                    <Clock className="w-8 h-8 text-zinc-300 dark:text-slate-700" />
                  </div>
                  <p className="font-medium text-zinc-500 dark:text-slate-400">Your history is clear</p>
                  <p className="text-sm text-zinc-400 dark:text-slate-500 max-w-xs mt-1">
                    Successful computations will appear here for easy reference and recall.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative bg-zinc-50 dark:bg-slate-900/40 border-y border-r border-l-4 border-zinc-100 dark:border-slate-800/80 border-l-transparent hover:border-l-blue-500 dark:hover:border-l-blue-500 rounded-xl p-4 transition-all duration-200 hover:border-zinc-200 dark:hover:border-slate-700 flex flex-col"
                    >
                      {/* Delete item button */}
                      <button
                        id={`delete-history-item-${item.id}`}
                        onClick={() => onDeleteItem(item.id)}
                        className="absolute top-3 right-3 p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer hover:bg-zinc-200 dark:hover:bg-slate-800"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Display expression */}
                      <span className="text-sm text-zinc-500 dark:text-slate-400 font-mono break-all pr-6">
                        {formatFormulaForDisplay(item.expression)}
                      </span>

                      {/* Result */}
                      <span className="text-xl font-semibold text-zinc-900 dark:text-white font-mono mt-1 break-all flex items-center justify-between">
                        {item.result}
                        <button
                          id={`recall-history-item-${item.id}`}
                          onClick={() => onSelectExpression(item.expression, item.result)}
                          className="p-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 cursor-pointer font-sans"
                          title="Paste back to calculator"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                          <span>Recall</span>
                        </button>
                      </span>

                      {/* Timestamp */}
                      <span className="text-[10px] text-zinc-400 dark:text-slate-500 mt-2">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type Theme = "light" | "dark";

export interface CalculatorState {
  formula: string;
  currentInput: string;
  isDegrees: boolean;
  history: HistoryItem[];
  isError: boolean;
  errorMessage: string;
  isEvaluated: boolean;
  theme: Theme;
}

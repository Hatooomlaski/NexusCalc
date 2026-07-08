/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Math Evaluation Engine (Business Logic)
// Implements Shunting-Yard algorithm for safe parsing without eval().

export interface Operator {
  precedence: number;
  associativity: "left" | "right";
}

export const OPERATORS: Record<string, Operator> = {
  "+": { precedence: 2, associativity: "left" },
  "-": { precedence: 2, associativity: "left" },
  "*": { precedence: 3, associativity: "left" },
  "/": { precedence: 3, associativity: "left" },
  "u-": { precedence: 4, associativity: "right" }, // Unary minus (negation)
  "u+": { precedence: 4, associativity: "right" }, // Unary plus (identity)
  "^": { precedence: 5, associativity: "right" },  // Exponentiation
  "%": { precedence: 6, associativity: "left" },   // Percentage
};

export const FUNCTIONS = new Set(["sin", "cos", "tan", "ln", "log", "sqrt"]);

export const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
};

/**
 * Strips floating-point precision errors (e.g., 0.1 + 0.2 -> 0.3)
 */
export function stripPrecision(num: number): number {
  if (!isFinite(num)) return num;
  // Convert to high-precision string and back to clear floating point jitter
  return parseFloat(num.toPrecision(12));
}

/**
 * Tokenizes a mathematical expression string
 */
export function tokenize(expression: string): string[] {
  const result: string[] = [];
  let i = 0;
  
  while (i < expression.length) {
    const char = expression[i];
    
    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    // Check for numbers (including decimals)
    if (/[0-9.]/.test(char)) {
      let numStr = "";
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        numStr += expression[i];
        i++;
      }
      result.push(numStr);
      continue;
    }
    
    // Check for alphabetical identifiers (functions/constants)
    if (/[a-zA-Z]/.test(char)) {
      let idStr = "";
      while (i < expression.length && /[a-zA-Z]/.test(expression[i])) {
        idStr += expression[i];
        i++;
      }
      result.push(idStr);
      continue;
    }
    
    // Supported operators and parentheses
    if ("()+-*/^%".includes(char)) {
      result.push(char);
      i++;
      continue;
    }
    
    // Catch any other characters
    result.push(char);
    i++;
  }
  
  return result;
}

/**
 * Preprocesses tokens to handle:
 * 1. Implicit multiplication: e.g. "2pi" -> "2 * pi", "5(2+3)" -> "5 * (2+3)"
 * 2. Unary operators: e.g. "-5" -> "u-", "5"
 */
export function preprocessTokens(tokens: string[]): string[] {
  const step1: string[] = [];
  
  // 1. Implicit multiplication check
  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const prev = i > 0 ? tokens[i - 1] : null;
    
    if (prev) {
      const prevIsNum = !isNaN(Number(prev)) || prev in CONSTANTS || prev === "%" || prev === "x";
      const prevIsParenClose = prev === ")";
      const currIsNum = !isNaN(Number(current)) || current in CONSTANTS || current === "x";
      const currIsParenOpen = current === "(";
      const currIsFunc = FUNCTIONS.has(current);
      
      // Implicit multiplication triggers:
      // - "5 pi" or "5 sin(x)"
      // - ") (" or ") 5"
      // - "5 (" or ") pi"
      if (
        (prevIsNum && (currIsParenOpen || currIsFunc || current in CONSTANTS || current === "x")) ||
        (prevIsParenClose && (currIsNum || currIsParenOpen || currIsFunc))
      ) {
        step1.push("*");
      }
    }
    step1.push(current);
  }
  
  // 2. Unary prefix detection (+ and -)
  const result: string[] = [];
  for (let i = 0; i < step1.length; i++) {
    const token = step1[i];
    if (token === "-" || token === "+") {
      const prev = i > 0 ? result[result.length - 1] : null;
      // Unary if first, or preceded by operator, or preceded by open paren
      const isUnary = !prev || prev === "(" || prev in OPERATORS;
      if (isUnary) {
        result.push(token === "-" ? "u-" : "u+");
      } else {
        result.push(token);
      }
    } else {
      result.push(token);
    }
  }
  
  return result;
}

/**
 * Converts infix tokens to postfix (Reverse Polish Notation) using Shunting-Yard
 */
export function toRPN(tokens: string[]): string[] {
  const output: string[] = [];
  const stack: string[] = [];
  
  for (const token of tokens) {
    if (!isNaN(Number(token))) {
      output.push(token);
    } else if (token in CONSTANTS || token === "x") {
      output.push(token);
    } else if (FUNCTIONS.has(token)) {
      stack.push(token);
    } else if (token === "(") {
      stack.push(token);
    } else if (token === ")") {
      while (stack.length > 0 && stack[stack.length - 1] !== "(") {
        output.push(stack.pop()!);
      }
      if (stack.length === 0) {
        throw new Error("Mismatched parentheses");
      }
      stack.pop(); // Pop the left parenthesis "("
      
      // If the top of stack is a function, pop it onto output
      if (stack.length > 0 && FUNCTIONS.has(stack[stack.length - 1])) {
        output.push(stack.pop()!);
      }
    } else if (token in OPERATORS) {
      const op1 = token;
      while (stack.length > 0) {
        const op2 = stack[stack.length - 1];
        if (op2 in OPERATORS) {
          const prec1 = OPERATORS[op1].precedence;
          const prec2 = OPERATORS[op2].precedence;
          const assoc1 = OPERATORS[op1].associativity;
          
          if (
            (assoc1 === "left" && prec1 <= prec2) ||
            (assoc1 === "right" && prec1 < prec2)
          ) {
            output.push(stack.pop()!);
          } else {
            break;
          }
        } else {
          break;
        }
      }
      stack.push(op1);
    } else {
      throw new Error(`Unknown operator/token: "${token}"`);
    }
  }
  
  while (stack.length > 0) {
    const top = stack.pop()!;
    if (top === "(" || top === ")") {
      throw new Error("Mismatched parentheses");
    }
    output.push(top);
  }
  
  return output;
}

/**
 * Evaluates postfix RPN expression
 */
export function evaluateRPN(rpn: string[], isDegrees: boolean = false, xValue?: number): number {
  const stack: number[] = [];
  
  for (const token of rpn) {
    if (!isNaN(Number(token))) {
      stack.push(Number(token));
    } else if (token === "x") {
      stack.push(xValue !== undefined ? xValue : 0);
    } else if (token in CONSTANTS) {
      stack.push(CONSTANTS[token]);
    } else if (token in OPERATORS) {
      if (token === "u-") {
        if (stack.length < 1) throw new Error("Invalid expression");
        const val = stack.pop()!;
        stack.push(-val);
      } else if (token === "u+") {
        if (stack.length < 1) throw new Error("Invalid expression");
        // u+ is identity, do nothing
      } else if (token === "%") {
        if (stack.length < 1) throw new Error("Invalid expression");
        const val = stack.pop()!;
        stack.push(val / 100);
      } else {
        // Binary operators
        if (stack.length < 2) throw new Error("Invalid expression");
        const right = stack.pop()!;
        const left = stack.pop()!;
        
        switch (token) {
          case "+":
            stack.push(left + right);
            break;
          case "-":
            stack.push(left - right);
            break;
          case "*":
            stack.push(left * right);
            break;
          case "/":
            if (right === 0) {
              throw new Error("Cannot divide by zero");
            }
            stack.push(left / right);
            break;
          case "^":
            stack.push(Math.pow(left, right));
            break;
          default:
            throw new Error(`Unknown operator: ${token}`);
        }
      }
    } else if (FUNCTIONS.has(token)) {
      if (stack.length < 1) throw new Error("Invalid expression");
      const val = stack.pop()!;
      
      switch (token) {
        case "sin": {
          const angle = isDegrees ? (val * Math.PI) / 180 : val;
          stack.push(Math.sin(angle));
          break;
        }
        case "cos": {
          const angle = isDegrees ? (val * Math.PI) / 180 : val;
          stack.push(Math.cos(angle));
          break;
        }
        case "tan": {
          if (isDegrees && Math.abs((val % 180) - 90) < 1e-9) {
            throw new Error("Undefined (Tangent)");
          }
          const angle = isDegrees ? (val * Math.PI) / 180 : val;
          stack.push(Math.tan(angle));
          break;
        }
        case "sqrt":
          if (val < 0) {
            throw new Error("Invalid input (Square root of negative)");
          }
          stack.push(Math.sqrt(val));
          break;
        case "ln":
          if (val <= 0) {
            throw new Error("Invalid input (Log of non-positive)");
          }
          stack.push(Math.log(val));
          break;
        case "log":
          if (val <= 0) {
            throw new Error("Invalid input (Log of non-positive)");
          }
          stack.push(Math.log10(val));
          break;
        default:
          throw new Error(`Unknown function: ${token}`);
      }
    }
  }
  
  if (stack.length !== 1) {
    throw new Error("Invalid expression");
  }
  
  return stack[0];
}

/**
 * Main function to evaluate a full math expression string
 */
export function calculate(expressionStr: string, isDegrees: boolean = false, xValue?: number): number {
  if (!expressionStr.trim()) {
    throw new Error("Empty expression");
  }
  
  // Normalize visual representations
  let normalized = expressionStr
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/e/g, "e");
    
  // Auto-close open parentheses
  let openParenCount = 0;
  for (const char of normalized) {
    if (char === "(") openParenCount++;
    if (char === ")") openParenCount--;
  }
  if (openParenCount > 0) {
    normalized += ")".repeat(openParenCount);
  }
  
  const tokens = tokenize(normalized);
  const preprocessed = preprocessTokens(tokens);
  const rpn = toRPN(preprocessed);
  const rawResult = evaluateRPN(rpn, isDegrees, xValue);
  
  return stripPrecision(rawResult);
}

/**
 * Formats math formula string beautifully for scientific display
 */
export function formatFormulaForDisplay(formulaStr: string): string {
  if (!formulaStr) return "";
  
  return formulaStr
    .replace(/\*/g, " × ")
    .replace(/\//g, " ÷ ")
    .replace(/pi/g, "π")
    .replace(/sqrt\(/g, "√(")
    .replace(/u-/g, "-")
    .replace(/u\+/g, "+")
    .replace(/\^/g, "^");
}

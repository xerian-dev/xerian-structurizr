import * as vscode from "vscode";

/**
 * Categories of diagnostic errors
 */
export enum ErrorCategory {
  Lexical = "Lexical",
  Structural = "Structural",
  Semantic = "Semantic",
  Contextual = "Contextual",
}

/**
 * Represents a specific error case for testing
 */
export interface ErrorCase {
  /** Category of the error */
  category: ErrorCategory;
  /** Human-readable description of the error */
  description: string;
  /** Invalid DSL that should produce the error */
  invalidDsl: string;
  /** Expected diagnostic message (string or regex pattern) */
  expectedMessage: string | RegExp;
  /** Expected diagnostic severity */
  severity: vscode.DiagnosticSeverity;
  /** Grammar rule that this error validates */
  grammarRule: string;
}

/**
 * Lexical error cases - brace balance, string termination, comment termination
 */
export const LEXICAL_ERRORS: ErrorCase[] = [
  {
    category: ErrorCategory.Lexical,
    description: "Unclosed opening brace",
    invalidDsl: 'workspace "Test" {\n  model {\n',
    expectedMessage: /unclosed brace/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "block-structure",
  },
  {
    category: ErrorCategory.Lexical,
    description: "Unexpected closing brace",
    invalidDsl: 'workspace "Test" {\n}\n}',
    expectedMessage: /unexpected closing brace/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "block-structure",
  },
  {
    category: ErrorCategory.Lexical,
    description: "Unterminated string literal",
    invalidDsl: 'workspace "Test {\n}',
    expectedMessage: /unterminated string/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "string-literal",
  },
  {
    category: ErrorCategory.Lexical,
    description: "Unterminated block comment",
    invalidDsl: 'workspace "Test" {\n  /* comment\n  model {}\n}',
    expectedMessage: /unterminated.*comment/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "block-comment",
  },
];

/**
 * Structural error cases - workspace/model/views blocks, element declarations
 */
export const STRUCTURAL_ERRORS: ErrorCase[] = [
  {
    category: ErrorCategory.Structural,
    description: "Duplicate identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "A"\n    sys = softwareSystem "B"\n  }\n}',
    expectedMessage: /duplicate identifier/i,
    severity: vscode.DiagnosticSeverity.Warning,
    grammarRule: "identifier-uniqueness",
  },
];

/**
 * Semantic error cases - identifier references, type checking
 */
export const SEMANTIC_ERRORS: ErrorCase[] = [];

/**
 * Contextual error cases - block placement, nesting depth
 */
export const CONTEXTUAL_ERRORS: ErrorCase[] = [];

/**
 * Get all error cases across all categories
 */
export function getAllErrorCases(): ErrorCase[] {
  return [
    ...LEXICAL_ERRORS,
    ...STRUCTURAL_ERRORS,
    ...SEMANTIC_ERRORS,
    ...CONTEXTUAL_ERRORS,
  ];
}

/**
 * Get error cases by category
 */
export function getErrorCasesByCategory(category: ErrorCategory): ErrorCase[] {
  return getAllErrorCases().filter((ec) => ec.category === category);
}

/**
 * Get error cases by grammar rule
 */
export function getErrorCasesByGrammarRule(grammarRule: string): ErrorCase[] {
  return getAllErrorCases().filter((ec) => ec.grammarRule === grammarRule);
}

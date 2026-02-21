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
  // Brace balance errors (Task 5.1)
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
    description: "Multiple unmatched opening braces",
    invalidDsl: 'workspace "Test" {\n  model {\n    views {\n',
    expectedMessage: /unclosed brace/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "block-structure",
  },
  {
    category: ErrorCategory.Lexical,
    description: "Nested brace imbalance",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "A" {\n      container "C" {\n    }\n  }\n}',
    expectedMessage: /unclosed brace/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "block-structure",
  },
  // String termination errors (Task 5.3)
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
    description: "Unclosed string in element declaration",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System\n  }\n}',
    expectedMessage: /unterminated string/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "string-literal",
  },
  {
    category: ErrorCategory.Lexical,
    description: "Multi-line string without continuation",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "This is a\n    multi-line string"\n  }\n}',
    expectedMessage: /unterminated string/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "string-literal",
  },
  // Comment termination errors (Task 5.5)
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
  // Workspace structure errors (Task 6.1)
  {
    category: ErrorCategory.Structural,
    description: "Missing workspace block",
    invalidDsl: 'model {\n  u = person "User"\n}',
    expectedMessage: /workspace.*required/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "workspace-declaration",
  },
  {
    category: ErrorCategory.Structural,
    description: "Duplicate workspace block",
    invalidDsl:
      'workspace "Test1" {\n  model {}\n}\nworkspace "Test2" {\n  model {}\n}',
    expectedMessage: /duplicate workspace/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "workspace-declaration",
  },
  {
    category: ErrorCategory.Structural,
    description: "Missing model block",
    invalidDsl: 'workspace "Test" {\n  views {}\n}',
    expectedMessage: /model.*required/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "model-declaration",
  },
  {
    category: ErrorCategory.Structural,
    description: "Duplicate model block",
    invalidDsl: 'workspace "Test" {\n  model {}\n  model {}\n  views {}\n}',
    expectedMessage: /duplicate model/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "model-declaration",
  },
  {
    category: ErrorCategory.Structural,
    description: "Missing views block (warning)",
    invalidDsl: 'workspace "Test" {\n  model {\n    u = person "User"\n  }\n}',
    expectedMessage: /views.*recommended/i,
    severity: vscode.DiagnosticSeverity.Warning,
    grammarRule: "views-declaration",
  },
  // Element declaration errors
  {
    category: ErrorCategory.Structural,
    description: "Duplicate identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "A"\n    sys = softwareSystem "B"\n  }\n}',
    expectedMessage: /duplicate identifier/i,
    severity: vscode.DiagnosticSeverity.Warning,
    grammarRule: "identifier-uniqueness",
  },
  // Element declaration errors (Task 6.2)
  // Note: Some error cases are not yet implemented in diagnostics.ts
  // {
  //   category: ErrorCategory.Structural,
  //   description: "Missing element name",
  //   invalidDsl:
  //     'workspace "Test" {\n  model {\n    sys = softwareSystem\n  }\n}',
  //   expectedMessage: /element name.*required/i,
  //   severity: vscode.DiagnosticSeverity.Error,
  //   grammarRule: "element-declaration",
  // },
  // {
  //   category: ErrorCategory.Structural,
  //   description: "Invalid identifier character",
  //   invalidDsl:
  //     'workspace "Test" {\n  model {\n    my-sys = softwareSystem "A"\n  }\n}',
  //   expectedMessage: /invalid identifier/i,
  //   severity: vscode.DiagnosticSeverity.Error,
  //   grammarRule: "identifier-syntax",
  // },
  // {
  //   category: ErrorCategory.Structural,
  //   description: "Missing opening brace in element",
  //   invalidDsl:
  //     'workspace "Test" {\n  model {\n    sys = softwareSystem "A"\n      container "C"\n    }\n  }\n}',
  //   expectedMessage: /missing.*brace/i,
  //   severity: vscode.DiagnosticSeverity.Error,
  //   grammarRule: "element-block",
  // },
  {
    category: ErrorCategory.Structural,
    description: "Quote mismatch in element name",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System\n  }\n}',
    expectedMessage: /unterminated string|quote mismatch/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "string-literal",
  },
  {
    category: ErrorCategory.Structural,
    description: "Misspelled element type keyword",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = sofwareSystem "A"\n  }\n}',
    expectedMessage: /unrecognized|unknown|did you mean/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "element-type",
  },
  // Element placement errors (Task 6.4)
  {
    category: ErrorCategory.Structural,
    description: "Container outside softwareSystem",
    invalidDsl:
      'workspace "Test" {\n  model {\n    c = container "Container"\n  }\n}',
    expectedMessage: /container.*must be.*softwareSystem/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "element-placement",
  },
  {
    category: ErrorCategory.Structural,
    description: "Component outside container",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System" {\n      comp = component "Component"\n    }\n  }\n}',
    expectedMessage: /component.*must be.*container/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "element-placement",
  },
  {
    category: ErrorCategory.Structural,
    description: "Element in views block",
    invalidDsl:
      'workspace "Test" {\n  model {}\n  views {\n    sys = softwareSystem "A"\n  }\n}',
    expectedMessage: /element.*model block/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "context-placement",
  },
  // View declaration errors (Task 8.3)
  {
    category: ErrorCategory.Structural,
    description: "Invalid autoLayout direction",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    systemContext sys "key" {\n      include *\n      autoLayout diagonal\n    }\n  }\n}',
    expectedMessage: /invalid.*direction|autoLayout.*tb|bt|lr|rl/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "autolayout-direction",
  },
  // NOTE: Misspelled view type keyword detection is not yet implemented
  // {
  //   category: ErrorCategory.Structural,
  //   description: "Misspelled view type keyword",
  //   invalidDsl:
  //     'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    systemContxt sys "key" {\n      include *\n    }\n  }\n}',
  //   expectedMessage: /unrecognized|unknown|did you mean/i,
  //   severity: vscode.DiagnosticSeverity.Error,
  //   grammarRule: "view-type",
  // },
];

/**
 * Semantic error cases - identifier references, type checking
 */
export const SEMANTIC_ERRORS: ErrorCase[] = [
  // Relationship reference errors (Task 7.1)
  {
    category: ErrorCategory.Semantic,
    description: "Undefined source identifier in relationship",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n    unknown -> sys "Uses"\n  }\n  views {}\n}',
    expectedMessage: /undefined.*identifier.*unknown/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "relationship-reference",
  },
  {
    category: ErrorCategory.Semantic,
    description: "Undefined target identifier in relationship",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n    sys -> unknown "Uses"\n  }\n  views {}\n}',
    expectedMessage: /undefined.*identifier.*unknown/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "relationship-reference",
  },
  {
    category: ErrorCategory.Semantic,
    description: "Self-reference in relationship (warning)",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n    sys -> sys "Self-reference"\n  }\n  views {}\n}',
    expectedMessage: /self-referencing/i,
    severity: vscode.DiagnosticSeverity.Warning,
    grammarRule: "relationship-reference",
  },
  // Relationship syntax errors (Task 7.3)
  {
    category: ErrorCategory.Structural,
    description: "Invalid arrow syntax in relationship",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n    u > sys "Uses"\n  }\n  views {}\n}',
    expectedMessage: /invalid.*arrow|relationship.*syntax/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "relationship-syntax",
  },
  {
    category: ErrorCategory.Structural,
    description: "Missing target identifier in relationship",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    u -> "Uses"\n  }\n  views {}\n}',
    expectedMessage: /missing.*target|incomplete.*relationship/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "relationship-syntax",
  },
  {
    category: ErrorCategory.Structural,
    description: "Incomplete relationship declaration",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n    u ->\n  }\n  views {}\n}',
    expectedMessage: /incomplete.*relationship|missing.*target/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "relationship-syntax",
  },
  {
    category: ErrorCategory.Structural,
    description: "Quote mismatch in relationship description",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n    u -> sys "Uses\n  }\n  views {}\n}',
    expectedMessage: /unterminated string|quote mismatch/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "string-literal",
  },
  // Relationship placement errors (Task 7.5)
  {
    category: ErrorCategory.Contextual,
    description: "Relationship in views block",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n  }\n  views {\n    u -> sys "Uses"\n  }\n}',
    expectedMessage: /relationship.*model block/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "context-placement",
  },
  {
    category: ErrorCategory.Contextual,
    description: "Relationship in styles block",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n  }\n  views {}\n  styles {\n    u -> sys "Uses"\n  }\n}',
    expectedMessage: /relationship.*model block/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "context-placement",
  },
  // View scope errors (Task 8.1)
  {
    category: ErrorCategory.Semantic,
    description: "Undefined scope identifier in view",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    systemContext unknown "key" {\n      include *\n    }\n  }\n}',
    expectedMessage: /undefined.*identifier.*unknown/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "view-scope-reference",
  },
  {
    category: ErrorCategory.Semantic,
    description: "Missing scope for systemContext view",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    systemContext "key" {\n      include *\n    }\n  }\n}',
    expectedMessage: /missing scope.*systemContext/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "view-scope-required",
  },
  {
    category: ErrorCategory.Semantic,
    description: "Missing scope for container view",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    container "key" {\n      include *\n    }\n  }\n}',
    expectedMessage: /missing scope.*container/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "view-scope-required",
  },
  {
    category: ErrorCategory.Semantic,
    description: "Missing scope for component view",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System" {\n      c = container "Container"\n    }\n  }\n  views {\n    component "key" {\n      include *\n    }\n  }\n}',
    expectedMessage: /missing scope.*component/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "view-scope-required",
  },
  {
    category: ErrorCategory.Semantic,
    description: "Scope type mismatch - container view with person scope",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n  }\n  views {\n    container u "key" {\n      include *\n    }\n  }\n}',
    expectedMessage: /container view.*softwareSystem/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "view-scope-type",
  },
  {
    category: ErrorCategory.Semantic,
    description:
      "Scope type mismatch - component view with softwareSystem scope",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    component sys "key" {\n      include *\n    }\n  }\n}',
    expectedMessage: /component view.*container/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "view-scope-type",
  },
  // View declaration errors (Task 8.3)
  {
    category: ErrorCategory.Semantic,
    description: "Duplicate view key",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n  }\n  views {\n    systemContext sys "myKey" {\n      include *\n    }\n    systemContext sys "myKey" {\n      include *\n    }\n  }\n}',
    expectedMessage: /duplicate.*view.*key/i,
    severity: vscode.DiagnosticSeverity.Warning,
    grammarRule: "view-key-uniqueness",
  },
];

/**
 * Contextual error cases - block placement, nesting depth
 */
export const CONTEXTUAL_ERRORS: ErrorCase[] = [
  // Relationship placement errors (Task 7.5)
  {
    category: ErrorCategory.Contextual,
    description: "Relationship in views block",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n  }\n  views {\n    u -> sys "Uses"\n  }\n}',
    expectedMessage: /relationship.*model block/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "context-placement",
  },
  {
    category: ErrorCategory.Contextual,
    description: "Relationship in styles block",
    invalidDsl:
      'workspace "Test" {\n  model {\n    u = person "User"\n    sys = softwareSystem "System"\n  }\n  views {}\n  styles {\n    u -> sys "Uses"\n  }\n}',
    expectedMessage: /relationship.*model block/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "context-placement",
  },
  // View placement errors (Task 8.5)
  // NOTE: View in model block detection is not yet implemented
  // {
  //   category: ErrorCategory.Contextual,
  //   description: "View in model block",
  //   invalidDsl:
  //     'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n    systemContext sys "key" {\n      include *\n    }\n  }\n  views {}\n}',
  //   expectedMessage: /view.*views block/i,
  //   severity: vscode.DiagnosticSeverity.Error,
  //   grammarRule: "context-placement",
  // },
  {
    category: ErrorCategory.Contextual,
    description: "Include directive outside view block",
    invalidDsl:
      'workspace "Test" {\n  model {\n    sys = softwareSystem "System"\n    include *\n  }\n  views {}\n}',
    expectedMessage: /include.*view block/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "context-placement",
  },
  // Reserved keyword errors (Task 12.1)
  {
    category: ErrorCategory.Contextual,
    description: "Reserved keyword 'workspace' used as identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    workspace = softwareSystem "System"\n  }\n  views {}\n}',
    expectedMessage: /reserved keyword.*workspace/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "reserved-keyword",
  },
  {
    category: ErrorCategory.Contextual,
    description: "Reserved keyword 'model' used as identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    model = softwareSystem "System"\n  }\n  views {}\n}',
    expectedMessage: /reserved keyword.*model/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "reserved-keyword",
  },
  {
    category: ErrorCategory.Contextual,
    description: "Reserved keyword 'views' used as identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    views = softwareSystem "System"\n  }\n  views {}\n}',
    expectedMessage: /reserved keyword.*views/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "reserved-keyword",
  },
  {
    category: ErrorCategory.Contextual,
    description: "Reserved keyword 'person' used as identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    person = softwareSystem "System"\n  }\n  views {}\n}',
    expectedMessage: /reserved keyword.*person/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "reserved-keyword",
  },
  {
    category: ErrorCategory.Contextual,
    description: "Reserved keyword 'softwareSystem' used as identifier",
    invalidDsl:
      'workspace "Test" {\n  model {\n    softwareSystem = person "User"\n  }\n  views {}\n}',
    expectedMessage: /reserved keyword.*softwareSystem/i,
    severity: vscode.DiagnosticSeverity.Error,
    grammarRule: "reserved-keyword",
  },
];

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

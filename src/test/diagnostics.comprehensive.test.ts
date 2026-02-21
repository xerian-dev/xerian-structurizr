import * as vscode from "vscode";
import {
  expectDiagnostic,
  expectNoDiagnostics,
  expectDiagnosticAt,
  expectMultipleDiagnostics,
  cleanupDocuments,
} from "./helpers/diagnosticHelpers";
import {
  ErrorCategory,
  LEXICAL_ERRORS,
  STRUCTURAL_ERRORS,
  getAllErrorCases,
  getErrorCasesByCategory,
} from "./helpers/errorCatalog";

teardown(async () => {
  await cleanupDocuments();
});

suite("Comprehensive Diagnostics - Helper Functions", () => {
  test("expectDiagnostic - verifies diagnostic message and severity", async () => {
    await expectDiagnostic(
      'workspace "Test" {\n  model {\n',
      /unclosed brace/i,
      vscode.DiagnosticSeverity.Error,
    );
  });

  test("expectNoDiagnostics - verifies valid DSL produces no errors", async () => {
    await expectNoDiagnostics(
      'workspace "Test" {\n  model {\n  }\n  views {\n  }\n}',
    );
  });

  test("expectDiagnosticAt - verifies diagnostic range accuracy", async () => {
    const content = 'workspace "Test" {\n}\n}';
    // Unexpected closing brace at line 2, character 0
    await expectDiagnosticAt(content, 2, 0, 1, /unexpected closing brace/i);
  });

  test("expectMultipleDiagnostics - verifies multiple error detection", async () => {
    const content = [
      'workspace "Test" {',
      "  model {",
      '    sys = softwareSystem "A"',
      '    sys = softwareSystem "B"',
      "  }",
      "}",
    ].join("\n");

    // Expecting 1 diagnostic for duplicate identifier
    await expectMultipleDiagnostics(content, 1);
  });
});

suite("Comprehensive Diagnostics - Error Catalog", () => {
  test("error catalog contains lexical errors", () => {
    const lexicalErrors = getErrorCasesByCategory(ErrorCategory.Lexical);
    if (lexicalErrors.length === 0) {
      throw new Error("Expected at least one lexical error in catalog");
    }
  });

  test("error catalog contains structural errors", () => {
    const structuralErrors = getErrorCasesByCategory(ErrorCategory.Structural);
    if (structuralErrors.length === 0) {
      throw new Error("Expected at least one structural error in catalog");
    }
  });

  test("all error cases have required fields", () => {
    const allErrors = getAllErrorCases();
    for (const errorCase of allErrors) {
      if (!errorCase.category) {
        throw new Error("Error case missing category");
      }
      if (!errorCase.description) {
        throw new Error("Error case missing description");
      }
      if (!errorCase.invalidDsl) {
        throw new Error("Error case missing invalidDsl");
      }
      if (!errorCase.expectedMessage) {
        throw new Error("Error case missing expectedMessage");
      }
      if (errorCase.severity === undefined) {
        throw new Error("Error case missing severity");
      }
      if (!errorCase.grammarRule) {
        throw new Error("Error case missing grammarRule");
      }
    }
  });
});

suite("Comprehensive Diagnostics - Lexical Errors", () => {
  for (const errorCase of LEXICAL_ERRORS) {
    test(`${errorCase.description}`, async () => {
      await expectDiagnostic(
        errorCase.invalidDsl,
        errorCase.expectedMessage,
        errorCase.severity,
      );
    });
  }
});

suite("Comprehensive Diagnostics - Structural Errors", () => {
  for (const errorCase of STRUCTURAL_ERRORS) {
    test(`${errorCase.description}`, async () => {
      await expectDiagnostic(
        errorCase.invalidDsl,
        errorCase.expectedMessage,
        errorCase.severity,
      );
    });
  }
});

import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { openDslContent, cleanupDocuments } from "./helpers/diagnosticHelpers";

const sampleDir = path.resolve(__dirname, "..", "..", "test-samples");

async function waitForDiagnostics(
  uri: vscode.Uri,
  expectedCount: number,
  timeoutMs = 5000,
): Promise<vscode.Diagnostic[]> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const diags = vscode.languages.getDiagnostics(uri);
    if (diags.length === expectedCount) {
      return diags;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return vscode.languages.getDiagnostics(uri);
}

async function openDslDocument(filePath: string): Promise<vscode.TextDocument> {
  const uri = vscode.Uri.file(filePath);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  return doc;
}

teardown(async () => {
  await cleanupDocuments();
});

suite("Diagnostics", () => {
  test("valid DSL file produces no diagnostics", async () => {
    const doc = await openDslDocument(path.join(sampleDir, "example.strz"));
    const diags = await waitForDiagnostics(doc.uri, 0);
    assert.strictEqual(
      diags.length,
      0,
      "Expected 0 diagnostics for valid file",
    );
  });

  test("reports unmatched opening brace", async () => {
    const doc = await openDslContent('workspace "Test" {\n  model {\n');
    const diags = await waitForDiagnostics(doc.uri, 1);
    assert.strictEqual(diags.length, 1);
    assert.ok(
      diags[0].message.includes("unclosed brace"),
      `Expected 'unclosed brace' but got '${diags[0].message}'`,
    );
    assert.strictEqual(diags[0].severity, vscode.DiagnosticSeverity.Error);
  });

  test("reports unexpected closing brace", async () => {
    const doc = await openDslContent('workspace "Test" {\n}\n}');
    const diags = await waitForDiagnostics(doc.uri, 1);
    assert.strictEqual(diags.length, 1);
    assert.ok(diags[0].message.includes("Unexpected closing brace"));
  });

  test("reports unterminated string", async () => {
    const doc = await openDslContent('workspace "Test {\n}');
    const diags = await waitForDiagnostics(doc.uri, 1);
    assert.ok(diags.length >= 1, "Expected at least 1 diagnostic");
    const stringDiag = diags.find((d) =>
      d.message.includes("Unterminated string"),
    );
    assert.ok(stringDiag, 'Expected an "Unterminated string" diagnostic');
  });

  test("reports duplicate identifiers", async () => {
    const content = [
      'workspace "Test" {',
      "  model {",
      '    sys = softwareSystem "System A"',
      '    sys = softwareSystem "System B"',
      "  }",
      "}",
    ].join("\n");
    const doc = await openDslContent(content);
    const diags = await waitForDiagnostics(doc.uri, 1);
    assert.strictEqual(diags.length, 1);
    assert.ok(diags[0].message.includes("Duplicate identifier"));
    assert.strictEqual(diags[0].severity, vscode.DiagnosticSeverity.Warning);
  });
});

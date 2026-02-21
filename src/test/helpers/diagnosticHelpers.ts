import * as assert from "assert";
import * as vscode from "vscode";

/**
 * Wait for diagnostics to be updated with optional timeout
 */
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

/**
 * Create a document with DSL content for testing
 */
export async function openDslContent(
  content: string,
): Promise<vscode.TextDocument> {
  const doc = await vscode.workspace.openTextDocument({
    language: "structurizr",
    content,
  });
  await vscode.window.showTextDocument(doc);
  return doc;
}

/**
 * Close all open editors and clear diagnostics
 */
export async function cleanupDocuments(): Promise<void> {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
}

/**
 * Verify that a diagnostic with the expected message and severity exists
 */
export async function expectDiagnostic(
  content: string,
  expectedMessage: string | RegExp,
  expectedSeverity: vscode.DiagnosticSeverity,
): Promise<void> {
  const doc = await openDslContent(content);

  // Wait for diagnostics to be generated
  await new Promise((resolve) => setTimeout(resolve, 200));

  const diagnostics = vscode.languages.getDiagnostics(doc.uri);

  assert.ok(
    diagnostics.length > 0,
    `Expected at least one diagnostic, but got none`,
  );

  const matchingDiag = diagnostics.find((d) => {
    const messageMatches =
      typeof expectedMessage === "string"
        ? d.message.includes(expectedMessage)
        : expectedMessage.test(d.message);
    const severityMatches = d.severity === expectedSeverity;
    return messageMatches && severityMatches;
  });

  assert.ok(
    matchingDiag,
    `Expected diagnostic with message matching ${expectedMessage} and severity ${expectedSeverity}, but found:\n${diagnostics.map((d) => `  - ${d.message} (severity: ${d.severity})`).join("\n")}`,
  );
}

/**
 * Verify that valid DSL produces no diagnostics
 */
export async function expectNoDiagnostics(content: string): Promise<void> {
  const doc = await openDslContent(content);

  // Wait for diagnostics to be generated
  await new Promise((resolve) => setTimeout(resolve, 200));

  const diagnostics = vscode.languages.getDiagnostics(doc.uri);

  assert.strictEqual(
    diagnostics.length,
    0,
    `Expected no diagnostics, but found:\n${diagnostics.map((d) => `  - ${d.message} at line ${d.range.start.line + 1}`).join("\n")}`,
  );
}

/**
 * Verify that a diagnostic exists at a specific location
 */
export async function expectDiagnosticAt(
  content: string,
  line: number,
  startChar: number,
  endChar: number,
  expectedMessage?: string | RegExp,
): Promise<void> {
  const doc = await openDslContent(content);

  // Wait for diagnostics to be generated
  await new Promise((resolve) => setTimeout(resolve, 200));

  const diagnostics = vscode.languages.getDiagnostics(doc.uri);

  const matchingDiag = diagnostics.find((d) => {
    const rangeMatches =
      d.range.start.line === line &&
      d.range.start.character === startChar &&
      d.range.end.character === endChar;

    if (!expectedMessage) {
      return rangeMatches;
    }

    const messageMatches =
      typeof expectedMessage === "string"
        ? d.message.includes(expectedMessage)
        : expectedMessage.test(d.message);

    return rangeMatches && messageMatches;
  });

  assert.ok(
    matchingDiag,
    `Expected diagnostic at line ${line}, chars ${startChar}-${endChar}${expectedMessage ? ` with message matching ${expectedMessage}` : ""}, but found:\n${diagnostics.map((d) => `  - ${d.message} at line ${d.range.start.line}, chars ${d.range.start.character}-${d.range.end.character}`).join("\n")}`,
  );
}

/**
 * Verify that multiple diagnostics are produced
 */
export async function expectMultipleDiagnostics(
  content: string,
  expectedCount: number,
): Promise<vscode.Diagnostic[]> {
  const doc = await openDslContent(content);

  // Wait for diagnostics to be generated
  const diagnostics = await waitForDiagnostics(doc.uri, expectedCount, 5000);

  assert.strictEqual(
    diagnostics.length,
    expectedCount,
    `Expected ${expectedCount} diagnostics, but found ${diagnostics.length}:\n${diagnostics.map((d) => `  - ${d.message} at line ${d.range.start.line + 1}`).join("\n")}`,
  );

  return diagnostics;
}

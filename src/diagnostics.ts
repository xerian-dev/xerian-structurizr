import * as vscode from "vscode";

const diagnosticCollection =
  vscode.languages.createDiagnosticCollection("structurizr");

export function registerDiagnostics(context: vscode.ExtensionContext): void {
  // Run diagnostics on active editor
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document);
  }

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && editor.document.languageId === "structurizr") {
        updateDiagnostics(editor.document);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.languageId === "structurizr") {
        updateDiagnostics(event.document);
      }
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri);
    }),
    diagnosticCollection,
  );
}

function updateDiagnostics(document: vscode.TextDocument): void {
  if (document.languageId !== "structurizr") {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  // Build identifier map for reference validation
  const identifierMap = buildIdentifierMap(lines);

  // Lexical checks
  checkBraceBalance(lines, diagnostics);
  checkUnclosedStrings(lines, diagnostics);
  checkDuplicateIdentifiers(lines, diagnostics);

  // Structural checks
  checkWorkspaceStructure(lines, diagnostics);
  checkElementPlacement(lines, diagnostics);
  checkAdditionalSyntax(lines, diagnostics);

  // Semantic checks
  checkRelationshipReferences(lines, diagnostics, identifierMap);
  checkViewScopes(lines, diagnostics, identifierMap);

  // Context-aware checks
  checkContextAwarePlacement(lines, diagnostics);
  checkKeywordSpelling(lines, diagnostics);

  diagnosticCollection.set(document.uri, diagnostics);
}

function checkBraceBalance(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  let depth = 0;
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (let j = 0; j < line.length; j++) {
      // Handle block comments
      if (inBlockComment) {
        if (line[j] === "*" && line[j + 1] === "/") {
          inBlockComment = false;
          j++; // skip /
        }
        continue;
      }

      if (line[j] === "/" && line[j + 1] === "*") {
        inBlockComment = true;
        j++; // skip *
        continue;
      }

      if (line[j] === "/" && line[j + 1] === "/") {
        break; // rest of line is comment
      }

      // Skip strings
      if (line[j] === '"') {
        j++;
        while (j < line.length && line[j] !== '"') {
          if (line[j] === "\\") j++; // skip escaped char
          j++;
        }
        continue;
      }

      if (line[j] === "{") {
        depth++;
      } else if (line[j] === "}") {
        depth--;
        if (depth < 0) {
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, j, i, j + 1),
              "Unexpected closing brace",
              vscode.DiagnosticSeverity.Error,
            ),
          );
          depth = 0;
        }
      }
    }
  }

  if (depth > 0 && !inBlockComment) {
    const lastLine = lines.length - 1;
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(lastLine, 0, lastLine, lines[lastLine].length),
        `${depth} unclosed brace${depth > 1 ? "s" : ""}`,
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }

  if (inBlockComment) {
    const lastLine = lines.length - 1;
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(lastLine, 0, lastLine, lines[lastLine].length),
        "Unterminated block comment",
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }
}

function checkUnclosedStrings(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let inString = false;
    let stringStart = 0;

    for (let j = 0; j < line.length; j++) {
      if (inBlockComment) {
        if (line[j] === "*" && line[j + 1] === "/") {
          inBlockComment = false;
          j++;
        }
        continue;
      }

      if (line[j] === "/" && line[j + 1] === "*") {
        inBlockComment = true;
        j++;
        continue;
      }

      if (line[j] === "/" && line[j + 1] === "/") {
        break;
      }

      if (line[j] === '"') {
        if (inString) {
          inString = false;
        } else {
          inString = true;
          stringStart = j;
        }
      } else if (line[j] === "\\" && inString) {
        j++; // skip escaped char
      }
    }

    if (inString) {
      // Check if line ends with \ (line continuation)
      if (!line.trimEnd().endsWith("\\")) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, stringStart, i, line.length),
            "Unterminated string",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }
  }
}

function checkDuplicateIdentifiers(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  const identifiers = new Map<string, number>();
  const pattern =
    /^\s*(\w+)\s*=\s*(?:person|softwareSystem|softwaresystem|container|component|deploymentNode|deploymentEnvironment|infrastructureNode|group)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern);
    if (match) {
      const id = match[1];
      if (identifiers.has(id)) {
        const firstLine = identifiers.get(id);
        if (firstLine !== undefined) {
          const col = lines[i].indexOf(id);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + id.length),
              `Duplicate identifier '${id}' (first defined on line ${firstLine + 1})`,
              vscode.DiagnosticSeverity.Warning,
            ),
          );
        }
      } else {
        identifiers.set(id, i);
      }
    }
  }
}

// Helper: Build identifier map for reference validation
interface IdentifierInfo {
  line: number;
  type: string;
}

function buildIdentifierMap(lines: string[]): Map<string, IdentifierInfo> {
  const identifiers = new Map<string, IdentifierInfo>();
  const pattern =
    /^\s*(\w+)\s*=\s*(person|softwareSystem|softwaresystem|container|component|deploymentNode|deploymentEnvironment|infrastructureNode|group)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern);
    if (match) {
      identifiers.set(match[1], {
        line: i,
        type: match[2].toLowerCase(),
      });
    }
  }

  return identifiers;
}

// Task 3.1: Workspace structure validation
function checkWorkspaceStructure(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  let workspaceCount = 0;
  let modelCount = 0;
  let viewsCount = 0;
  let workspaceLine = -1;

  const contextStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments and empty lines
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    // Track workspace blocks
    if (trimmed.match(/^workspace\b/i)) {
      workspaceCount++;
      workspaceLine = i;
      contextStack.push("workspace");

      if (workspaceCount > 1) {
        const col = lines[i].indexOf("workspace");
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + 9),
            "Duplicate workspace block (workspace should only be declared once)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Track model blocks
    if (trimmed.match(/^model\b/i)) {
      modelCount++;
      contextStack.push("model");

      if (modelCount > 1) {
        const col = lines[i].indexOf("model");
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + 5),
            "Duplicate model block (model should only be declared once)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Track views blocks
    if (trimmed.match(/^views\b/i)) {
      viewsCount++;
      contextStack.push("views");
    }

    // Track braces for context
    for (const ch of lines[i]) {
      if (ch === "}") {
        if (contextStack.length > 0) {
          contextStack.pop();
        }
      }
    }
  }

  // Check for missing workspace
  if (workspaceCount === 0) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        "Missing workspace block (workspace declaration is required)",
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }

  // Check for missing model
  if (modelCount === 0 && workspaceCount > 0) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(
          workspaceLine,
          0,
          workspaceLine,
          lines[workspaceLine].length,
        ),
        "Missing model block (model block is required within workspace)",
        vscode.DiagnosticSeverity.Error,
      ),
    );
  }

  // Check for missing views (warning only)
  if (viewsCount === 0 && workspaceCount > 0) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(
          workspaceLine,
          0,
          workspaceLine,
          lines[workspaceLine].length,
        ),
        "Missing views block (views are recommended for visualization)",
        vscode.DiagnosticSeverity.Warning,
      ),
    );
  }
}

// Task 3.2: Element placement validation
function checkElementPlacement(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  const contextStack: string[] = [];
  const elementPattern =
    /^\s*(?:\w+\s*=\s*)?(person|softwareSystem|softwaresystem|container|component|deploymentNode|deploymentEnvironment|infrastructureNode|group)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    // Track block context
    if (trimmed.match(/^workspace\b/i)) contextStack.push("workspace");
    else if (trimmed.match(/^model\b/i)) contextStack.push("model");
    else if (trimmed.match(/^views\b/i)) contextStack.push("views");
    else if (trimmed.match(/^styles\b/i)) contextStack.push("styles");
    else if (trimmed.match(/^softwareSystem\b/i) && trimmed.includes("{"))
      contextStack.push("softwareSystem");
    else if (trimmed.match(/^container\b/i) && trimmed.includes("{"))
      contextStack.push("container");

    // Check element declarations
    const elementMatch = trimmed.match(elementPattern);
    if (elementMatch) {
      const elementType = elementMatch[1].toLowerCase();
      const currentContext = contextStack[contextStack.length - 1];

      // Check container placement
      if (elementType === "container") {
        if (currentContext !== "softwareSystem") {
          const col = lines[i].indexOf(elementMatch[1]);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + elementMatch[1].length),
              "Invalid container placement (containers must be declared inside a softwareSystem block)",
              vscode.DiagnosticSeverity.Error,
            ),
          );
        }
      }

      // Check component placement
      if (elementType === "component") {
        if (currentContext !== "container") {
          const col = lines[i].indexOf(elementMatch[1]);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + elementMatch[1].length),
              "Invalid component placement (components must be declared inside a container block)",
              vscode.DiagnosticSeverity.Error,
            ),
          );
        }
      }

      // Check elements in views block
      if (currentContext === "views") {
        const col = lines[i].indexOf(elementMatch[1]);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + elementMatch[1].length),
            "Invalid element placement (elements belong in the model block, not views)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Track braces
    for (const ch of lines[i]) {
      if (ch === "}") {
        if (contextStack.length > 0) {
          contextStack.pop();
        }
      }
    }
  }
}

// Task 3.3: Relationship reference validation
function checkRelationshipReferences(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
  identifierMap: Map<string, IdentifierInfo>,
): void {
  const relationshipPattern = /^\s*(\w+)\s*->\s*(\w+)/;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    const relMatch = trimmed.match(relationshipPattern);
    if (relMatch) {
      const source = relMatch[1];
      const target = relMatch[2];

      // Check undefined source
      if (!identifierMap.has(source)) {
        const col = lines[i].indexOf(source);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + source.length),
            `Undefined source identifier '${source}' in relationship`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }

      // Check undefined target
      if (!identifierMap.has(target)) {
        const col = lines[i].indexOf(target, lines[i].indexOf("->") + 2);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + target.length),
            `Undefined target identifier '${target}' in relationship`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }

      // Check self-reference (warning)
      if (source === target && identifierMap.has(source)) {
        const col = lines[i].indexOf(source);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, lines[i].length),
            `Self-referencing relationship detected (${source} -> ${source})`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      }
    }
  }
}

// Task 3.4: View scope validation
function checkViewScopes(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
  identifierMap: Map<string, IdentifierInfo>,
): void {
  const viewPattern =
    /^\s*(systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\s+(?:(\w+)\s+)?/i;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    const viewMatch = trimmed.match(viewPattern);
    if (viewMatch) {
      const viewType = viewMatch[1].toLowerCase();
      const scope = viewMatch[2];

      // Views that require scope
      const requiresScope = ["systemcontext", "container", "component"];

      if (requiresScope.includes(viewType)) {
        if (!scope) {
          const col = lines[i].indexOf(viewMatch[1]);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + viewMatch[1].length),
              `Missing scope for ${viewMatch[1]} view (scope identifier is required)`,
              vscode.DiagnosticSeverity.Error,
            ),
          );
        } else if (!identifierMap.has(scope)) {
          const col = lines[i].indexOf(scope);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + scope.length),
              `Undefined scope identifier '${scope}' in view`,
              vscode.DiagnosticSeverity.Error,
            ),
          );
        } else {
          // Check scope type mismatch
          const scopeInfo = identifierMap.get(scope);
          if (scopeInfo) {
            const scopeType = scopeInfo.type;

            if (viewType === "container" && scopeType !== "softwaresystem") {
              const col = lines[i].indexOf(scope);
              diagnostics.push(
                new vscode.Diagnostic(
                  new vscode.Range(i, col, i, col + scope.length),
                  `Type mismatch: container view requires a softwareSystem scope, but '${scope}' is a ${scopeType}`,
                  vscode.DiagnosticSeverity.Error,
                ),
              );
            }

            if (viewType === "component" && scopeType !== "container") {
              const col = lines[i].indexOf(scope);
              diagnostics.push(
                new vscode.Diagnostic(
                  new vscode.Range(i, col, i, col + scope.length),
                  `Type mismatch: component view requires a container scope, but '${scope}' is a ${scopeType}`,
                  vscode.DiagnosticSeverity.Error,
                ),
              );
            }
          }
        }
      } else if (scope && !identifierMap.has(scope)) {
        // Optional scope but undefined
        const col = lines[i].indexOf(scope);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + scope.length),
            `Undefined scope identifier '${scope}' in view`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }
  }
}

// Task 3.5: Context-aware placement validation
function checkContextAwarePlacement(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  const contextStack: string[] = [];
  const relationshipPattern = /^\s*\w+\s*->\s*\w+/;
  const includePattern = /^\s*include\b/i;
  const stylePattern = /^\s*(element|relationship)\s+"/i;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    // Track block context
    if (trimmed.match(/^workspace\b/i)) contextStack.push("workspace");
    else if (trimmed.match(/^model\b/i)) contextStack.push("model");
    else if (trimmed.match(/^views\b/i)) contextStack.push("views");
    else if (trimmed.match(/^styles\b/i)) contextStack.push("styles");
    else if (
      trimmed.match(
        /^\s*(systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\b/i,
      ) &&
      trimmed.includes("{")
    )
      contextStack.push("view");

    const currentContext = contextStack[contextStack.length - 1];

    // Check relationship placement
    if (relationshipPattern.test(trimmed)) {
      if (currentContext === "views") {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, 0, i, lines[i].length),
            "Invalid relationship placement (relationships belong in the model block, not views)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Check view placement
    if (
      trimmed.match(
        /^\s*(systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\b/i,
      )
    ) {
      if (currentContext === "model") {
        const match = trimmed.match(
          /^\s*(systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\b/i,
        );
        if (match) {
          const col = lines[i].indexOf(match[1]);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + match[1].length),
              "Invalid view placement (views belong in the views block, not model)",
              vscode.DiagnosticSeverity.Error,
            ),
          );
        }
      }
    }

    // Check style rule placement
    if (stylePattern.test(trimmed)) {
      if (currentContext !== "styles") {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, 0, i, lines[i].length),
            "Invalid style rule placement (style rules must be inside the styles block)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Check include directive placement
    if (includePattern.test(trimmed)) {
      if (currentContext !== "view") {
        const col = lines[i].indexOf("include");
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + 7),
            "Invalid include placement (include directives must be inside a view block)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Track braces
    for (const ch of lines[i]) {
      if (ch === "}") {
        if (contextStack.length > 0) {
          contextStack.pop();
        }
      }
    }
  }
}

// Task 3.6: Keyword and syntax validation
function checkKeywordSpelling(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  const validElementTypes = [
    "person",
    "softwareSystem",
    "softwaresystem",
    "container",
    "component",
    "deploymentNode",
    "deploymentEnvironment",
    "infrastructureNode",
    "group",
  ];

  const validViewTypes = [
    "systemLandscape",
    "systemContext",
    "container",
    "component",
    "deployment",
    "dynamic",
    "filtered",
    "custom",
  ];

  const reservedKeywords = [
    "workspace",
    "model",
    "views",
    "styles",
    ...validElementTypes,
    ...validViewTypes,
    "include",
    "exclude",
    "autoLayout",
  ];

  // Check for misspelled element types
  const elementPattern = /^\s*(?:\w+\s*=\s*)?(\w+)\s+"/i;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    // Check element type keywords
    const elementMatch = trimmed.match(elementPattern);
    if (elementMatch) {
      const keyword = elementMatch[1];
      if (
        !validElementTypes.includes(keyword) &&
        !validViewTypes.includes(keyword) &&
        keyword !== "workspace" &&
        keyword !== "model" &&
        keyword !== "views" &&
        keyword !== "styles"
      ) {
        // Check if it's close to a valid keyword
        const suggestion = findClosestKeyword(keyword, [
          ...validElementTypes,
          ...validViewTypes,
        ]);
        if (suggestion) {
          const col = lines[i].indexOf(keyword);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + keyword.length),
              `Unknown keyword '${keyword}'. Did you mean '${suggestion}'?`,
              vscode.DiagnosticSeverity.Error,
            ),
          );
        }
      }
    }

    // Check for reserved keywords used as identifiers
    const identifierPattern = /^\s*(\w+)\s*=/;
    const idMatch = trimmed.match(identifierPattern);
    if (idMatch) {
      const identifier = idMatch[1];
      if (reservedKeywords.includes(identifier)) {
        const col = lines[i].indexOf(identifier);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + identifier.length),
            `Reserved keyword '${identifier}' cannot be used as an identifier`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }
  }
}

// Helper: Find closest keyword using Levenshtein distance
function findClosestKeyword(input: string, keywords: string[]): string | null {
  const threshold = 3;
  let minDistance = Infinity;
  let closest: string | null = null;

  for (const keyword of keywords) {
    const distance = levenshteinDistance(
      input.toLowerCase(),
      keyword.toLowerCase(),
    );
    if (distance < minDistance && distance <= threshold) {
      minDistance = distance;
      closest = keyword;
    }
  }

  return closest;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Task 3.7: Additional syntax validations
function checkAdditionalSyntax(
  lines: string[],
  diagnostics: vscode.Diagnostic[],
): void {
  const contextStack: string[] = [];
  const viewKeys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Skip comments
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed === ""
    ) {
      continue;
    }

    // Track context for nesting depth
    if (trimmed.match(/^workspace\b/i)) contextStack.push("workspace");
    else if (trimmed.match(/^model\b/i)) contextStack.push("model");
    else if (trimmed.match(/^views\b/i)) contextStack.push("views");

    // Check nesting depth
    if (contextStack.length > 6) {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(i, 0, i, lines[i].length),
          "Excessive nesting depth detected (consider simplifying structure)",
          vscode.DiagnosticSeverity.Warning,
        ),
      );
    }

    // Check for missing braces in element declarations
    const elementPattern =
      /^\s*(?:\w+\s*=\s*)?(person|softwareSystem|softwaresystem|container|component)\s+"[^"]*"\s*$/i;
    if (elementPattern.test(trimmed) && !trimmed.includes("{")) {
      // This might be intentional (single-line element), so we'll skip this check
    }

    // Check for invalid relationship arrow syntax
    if (trimmed.includes("->")) {
      const invalidArrowPattern = /\w+\s*[-=]+>\s*$/;
      if (invalidArrowPattern.test(trimmed)) {
        const col = lines[i].indexOf("->");
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, lines[i].length),
            "Incomplete relationship (missing target identifier)",
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Check for invalid autoLayout directions
    const autoLayoutPattern = /^\s*autoLayout\s+(\w+)/i;
    const layoutMatch = trimmed.match(autoLayoutPattern);
    if (layoutMatch) {
      const direction = layoutMatch[1].toLowerCase();
      const validDirections = ["tb", "bt", "lr", "rl"];
      if (!validDirections.includes(direction)) {
        const col = lines[i].indexOf(layoutMatch[1]);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + layoutMatch[1].length),
            `Invalid autoLayout direction '${direction}'. Valid options: tb, bt, lr, rl`,
            vscode.DiagnosticSeverity.Error,
          ),
        );
      }
    }

    // Check for duplicate view keys
    const viewPattern =
      /^\s*(?:systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\s+(?:\w+\s+)?"([^"]*)"/i;
    const viewMatch = trimmed.match(viewPattern);
    if (viewMatch) {
      const key = viewMatch[1];
      if (viewKeys.has(key)) {
        const col = lines[i].indexOf(key);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + key.length),
            `Duplicate view key '${key}'`,
            vscode.DiagnosticSeverity.Warning,
          ),
        );
      } else {
        viewKeys.add(key);
      }
    }

    // Track braces
    for (const ch of lines[i]) {
      if (ch === "}") {
        if (contextStack.length > 0) {
          contextStack.pop();
        }
      }
    }
  }
}

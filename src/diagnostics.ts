import * as vscode from 'vscode';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('structurizr');

export function registerDiagnostics(context: vscode.ExtensionContext): void {
    // Run diagnostics on active editor
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.languageId === 'structurizr') {
                updateDiagnostics(editor.document);
            }
        }),
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'structurizr') {
                updateDiagnostics(event.document);
            }
        }),
        vscode.workspace.onDidCloseTextDocument(doc => {
            diagnosticCollection.delete(doc.uri);
        }),
        diagnosticCollection
    );
}

function updateDiagnostics(document: vscode.TextDocument): void {
    if (document.languageId !== 'structurizr') {
        return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const lines = text.split('\n');

    checkBraceBalance(lines, diagnostics);
    checkUnclosedStrings(lines, diagnostics);
    checkDuplicateIdentifiers(lines, diagnostics);

    diagnosticCollection.set(document.uri, diagnostics);
}

function checkBraceBalance(lines: string[], diagnostics: vscode.Diagnostic[]): void {
    let depth = 0;
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (let j = 0; j < line.length; j++) {
            // Handle block comments
            if (inBlockComment) {
                if (line[j] === '*' && line[j + 1] === '/') {
                    inBlockComment = false;
                    j++; // skip /
                }
                continue;
            }

            if (line[j] === '/' && line[j + 1] === '*') {
                inBlockComment = true;
                j++; // skip *
                continue;
            }

            if (line[j] === '/' && line[j + 1] === '/') {
                break; // rest of line is comment
            }

            // Skip strings
            if (line[j] === '"') {
                j++;
                while (j < line.length && line[j] !== '"') {
                    if (line[j] === '\\') j++; // skip escaped char
                    j++;
                }
                continue;
            }

            if (line[j] === '{') {
                depth++;
            } else if (line[j] === '}') {
                depth--;
                if (depth < 0) {
                    diagnostics.push(new vscode.Diagnostic(
                        new vscode.Range(i, j, i, j + 1),
                        'Unexpected closing brace',
                        vscode.DiagnosticSeverity.Error
                    ));
                    depth = 0;
                }
            }
        }
    }

    if (depth > 0 && !inBlockComment) {
        const lastLine = lines.length - 1;
        diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(lastLine, 0, lastLine, lines[lastLine].length),
            `${depth} unclosed brace${depth > 1 ? 's' : ''}`,
            vscode.DiagnosticSeverity.Error
        ));
    }

    if (inBlockComment) {
        const lastLine = lines.length - 1;
        diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(lastLine, 0, lastLine, lines[lastLine].length),
            'Unterminated block comment',
            vscode.DiagnosticSeverity.Error
        ));
    }
}

function checkUnclosedStrings(lines: string[], diagnostics: vscode.Diagnostic[]): void {
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let inString = false;
        let stringStart = 0;

        for (let j = 0; j < line.length; j++) {
            if (inBlockComment) {
                if (line[j] === '*' && line[j + 1] === '/') {
                    inBlockComment = false;
                    j++;
                }
                continue;
            }

            if (line[j] === '/' && line[j + 1] === '*') {
                inBlockComment = true;
                j++;
                continue;
            }

            if (line[j] === '/' && line[j + 1] === '/') {
                break;
            }

            if (line[j] === '"') {
                if (inString) {
                    inString = false;
                } else {
                    inString = true;
                    stringStart = j;
                }
            } else if (line[j] === '\\' && inString) {
                j++; // skip escaped char
            }
        }

        if (inString) {
            // Check if line ends with \ (line continuation)
            if (!line.trimEnd().endsWith('\\')) {
                diagnostics.push(new vscode.Diagnostic(
                    new vscode.Range(i, stringStart, i, line.length),
                    'Unterminated string',
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
    }
}

function checkDuplicateIdentifiers(lines: string[], diagnostics: vscode.Diagnostic[]): void {
    const identifiers = new Map<string, number>();
    const pattern = /^\s*(\w+)\s*=\s*(?:person|softwareSystem|softwaresystem|container|component|deploymentNode|deploymentEnvironment|infrastructureNode|group)\b/i;

    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(pattern);
        if (match) {
            const id = match[1];
            if (identifiers.has(id)) {
                const firstLine = identifiers.get(id)!;
                const col = lines[i].indexOf(id);
                diagnostics.push(new vscode.Diagnostic(
                    new vscode.Range(i, col, i, col + id.length),
                    `Duplicate identifier '${id}' (first defined on line ${firstLine + 1})`,
                    vscode.DiagnosticSeverity.Warning
                ));
            } else {
                identifiers.set(id, i);
            }
        }
    }
}

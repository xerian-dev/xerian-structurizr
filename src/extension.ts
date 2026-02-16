import * as vscode from 'vscode';
import { registerLanguageFeatures } from './languageFeatures';
import { registerDiagnostics } from './diagnostics';
import { PreviewPanel } from './previewPanel';

export function activate(context: vscode.ExtensionContext) {
    console.log('Structurizr DSL extension is now active');

    registerLanguageFeatures(context);
    registerDiagnostics(context);

    // Preview command
    const showPreview = vscode.commands.registerCommand('structurizr.showPreview', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'structurizr') {
            PreviewPanel.createOrShow(context.extensionUri, editor.document);
        } else {
            vscode.window.showWarningMessage('Open a .dsl file to preview');
        }
    });

    // Auto-update preview on document change (debounced)
    let updateTimeout: ReturnType<typeof setTimeout> | undefined;
    const onDocChange = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'structurizr' && PreviewPanel.currentPanel) {
            if (updateTimeout) clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                PreviewPanel.currentPanel?.update(event.document);
            }, 500);
        }
    });

    context.subscriptions.push(showPreview, onDocChange);
}

export function deactivate() {}

import * as vscode from 'vscode';
import { convertToMermaid } from './dslToMermaid';

export class PreviewPanel {
    public static currentPanel: PreviewPanel | undefined;
    private static readonly viewType = 'structurizrPreview';

    private readonly panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];
    private currentViewIndex = 0;

    public static createOrShow(_extensionUri: vscode.Uri, document: vscode.TextDocument): void {
        const column = vscode.ViewColumn.Beside;

        if (PreviewPanel.currentPanel) {
            PreviewPanel.currentPanel.panel.reveal(column);
            PreviewPanel.currentPanel.update(document);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            PreviewPanel.viewType,
            'Structurizr Preview',
            column,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );

        PreviewPanel.currentPanel = new PreviewPanel(panel, document);
    }

    private constructor(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
        this.panel = panel;

        this.update(document);

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'selectView') {
                    this.currentViewIndex = message.index;
                    const editor = vscode.window.activeTextEditor;
                    if (editor && editor.document.languageId === 'structurizr') {
                        this.update(editor.document);
                    }
                }
            },
            null,
            this.disposables
        );
    }

    public update(document: vscode.TextDocument): void {
        const results = convertToMermaid(document);
        if (results.length === 0) return;

        const safeIndex = Math.min(this.currentViewIndex, results.length - 1);
        const mermaidCode = results[safeIndex].code;

        const viewOptions = results.map((r, i) => ({
            name: r.viewName,
            selected: i === safeIndex,
        }));

        this.panel.webview.html = this.getHtml(mermaidCode, viewOptions);
    }

    private getHtml(mermaidCode: string, views: { name: string; selected: boolean }[]): string {
        const nonce = getNonce();

        const viewSelector = views.length > 1
            ? `<div id="view-selector">
                <label for="view-select">View: </label>
                <select id="view-select" onchange="selectView(this.selectedIndex)">
                    ${views.map((v, i) => `<option value="${i}" ${v.selected ? 'selected' : ''}>${escapeHtml(v.name)}</option>`).join('')}
                </select>
            </div>`
            : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' https://cdn.jsdelivr.net; style-src 'nonce-${nonce}'; img-src data:;">
    <style nonce="${nonce}">
        body {
            margin: 0;
            padding: 16px;
            background: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
            font-family: var(--vscode-font-family, sans-serif);
            display: flex;
            flex-direction: column;
            height: 100vh;
            box-sizing: border-box;
        }
        #view-selector {
            margin-bottom: 12px;
            padding: 8px;
            background: var(--vscode-sideBar-background, #252526);
            border-radius: 4px;
        }
        #view-selector select {
            background: var(--vscode-input-background, #3c3c3c);
            color: var(--vscode-input-foreground, #cccccc);
            border: 1px solid var(--vscode-input-border, #3c3c3c);
            padding: 4px 8px;
            border-radius: 2px;
            font-size: 13px;
        }
        #diagram-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
        }
        .mermaid {
            max-width: 100%;
        }
        .mermaid svg {
            max-width: 100%;
            height: auto;
        }
        #error {
            color: var(--vscode-errorForeground, #f48771);
            padding: 16px;
            display: none;
        }
    </style>
</head>
<body>
    ${viewSelector}
    <div id="diagram-container">
        <pre class="mermaid">
${escapeHtml(mermaidCode)}
        </pre>
    </div>
    <div id="error"></div>

    <script nonce="${nonce}" type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

        mermaid.initialize({
            startOnLoad: true,
            theme: document.body.classList.contains('vscode-light') ? 'default' : 'dark',
            c4: {
                diagramMarginY: 20,
            },
            securityLevel: 'strict',
        });

        // Detect VS Code theme
        const isDark = document.body.getAttribute('data-vscode-theme-kind')?.includes('dark')
            ?? window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (!isDark) {
            mermaid.initialize({ theme: 'default' });
        }
    </script>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();

        function selectView(index) {
            vscode.postMessage({ command: 'selectView', index: index });
        }
    </script>
</body>
</html>`;
    }

    private dispose(): void {
        PreviewPanel.currentPanel = undefined;
        this.panel.dispose();
        while (this.disposables.length) {
            const d = this.disposables.pop();
            if (d) d.dispose();
        }
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

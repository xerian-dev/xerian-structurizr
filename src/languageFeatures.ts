import * as vscode from 'vscode';
import { getBlockContext, parseDocument, getElementIdentifiers } from './parser';

const KEYWORD_DOCS: Record<string, { detail: string; documentation: string }> = {
    workspace: {
        detail: 'workspace "name" "description" { ... }',
        documentation: 'The top-level wrapper for the entire architecture model and views.',
    },
    model: {
        detail: 'model { ... }',
        documentation: 'Contains all architecture elements (people, software systems, containers, components) and their relationships.',
    },
    views: {
        detail: 'views { ... }',
        documentation: 'Contains the visual diagram definitions and styling.',
    },
    person: {
        detail: 'identifier = person "Name" "Description"',
        documentation: 'Defines a person (user, actor, role) that interacts with the software systems.',
    },
    softwareSystem: {
        detail: 'identifier = softwareSystem "Name" "Description" { ... }',
        documentation: 'Defines a software system — the highest level of abstraction in the C4 model.',
    },
    container: {
        detail: 'identifier = container "Name" "Description" "Technology" { ... }',
        documentation: 'Defines a container (application, data store, etc.) within a software system.\n\nIn views: `container <system> "key" { ... }` creates a container diagram.',
    },
    component: {
        detail: 'identifier = component "Name" "Description" "Technology"',
        documentation: 'Defines a component within a container.\n\nIn views: `component <container> "key" { ... }` creates a component diagram.',
    },
    deploymentEnvironment: {
        detail: 'deploymentEnvironment "Name" { ... }',
        documentation: 'Defines a deployment environment (e.g., "Development", "Production").',
    },
    deploymentNode: {
        detail: 'deploymentNode "Name" "Description" "Technology" { ... }',
        documentation: 'Defines a deployment node (server, container runtime, etc.).',
    },
    systemContext: {
        detail: 'systemContext <identifier> "key" { ... }',
        documentation: 'Creates a System Context diagram showing a software system and its relationships with people and other systems.',
    },
    systemLandscape: {
        detail: 'systemLandscape "key" { ... }',
        documentation: 'Creates a System Landscape diagram showing all people and software systems.',
    },
    dynamic: {
        detail: 'dynamic <scope> "key" { ... }',
        documentation: 'Creates a dynamic diagram showing interactions in a specific scenario.',
    },
    deployment: {
        detail: 'deployment <system> "environment" "key" { ... }',
        documentation: 'Creates a deployment diagram showing how software systems/containers are deployed.',
    },
    styles: {
        detail: 'styles { ... }',
        documentation: 'Defines visual styles for elements and relationships based on tags.',
    },
    autoLayout: {
        detail: 'autoLayout [lr|rl|tb|bt]',
        documentation: 'Enables automatic layout. Directions: lr (left-right), rl (right-left), tb (top-bottom), bt (bottom-top).',
    },
    include: {
        detail: 'include <elements>',
        documentation: 'Includes elements in a view. Use `*` to include all elements.',
    },
    exclude: {
        detail: 'exclude <elements>',
        documentation: 'Excludes elements from a view.',
    },
    tags: {
        detail: 'tags "Tag1" "Tag2"',
        documentation: 'Applies tags to an element for styling and filtering.',
    },
    group: {
        detail: 'group "Name" { ... }',
        documentation: 'Groups elements together visually.',
    },
    theme: {
        detail: 'theme <url>',
        documentation: 'Imports a theme from a URL for styling elements.',
    },
    themes: {
        detail: 'themes <url1> <url2>',
        documentation: 'Imports multiple themes from URLs.',
    },
};

const MODEL_KEYWORDS = ['person', 'softwareSystem', 'container', 'component', 'group', 'deploymentEnvironment', 'deploymentNode'];
const VIEW_KEYWORDS = ['systemLandscape', 'systemContext', 'container', 'component', 'deployment', 'dynamic', 'filtered', 'custom', 'styles'];
const VIEW_CONTENT_KEYWORDS = ['include', 'exclude', 'autoLayout', 'autolayout', 'title', 'description', 'animation', 'properties'];
const STYLE_KEYWORDS = ['element', 'relationship'];
const STYLE_PROPERTIES = ['shape', 'icon', 'width', 'height', 'background', 'color', 'colour', 'stroke', 'strokeWidth', 'fontSize', 'border', 'opacity', 'metadata', 'routing', 'position', 'thickness'];
const SHAPES = ['Box', 'RoundedBox', 'Circle', 'Cylinder', 'Ellipse', 'Hexagon', 'Diamond', 'Pipe', 'Person', 'Robot', 'Folder', 'WebBrowser', 'MobileDevicePortrait', 'MobileDeviceLandscape', 'Component'];

function createCompletionItem(label: string, kind: vscode.CompletionItemKind, detail?: string, docs?: string): vscode.CompletionItem {
    const item = new vscode.CompletionItem(label, kind);
    if (detail) item.detail = detail;
    if (docs) item.documentation = new vscode.MarkdownString(docs);
    return item;
}

export function registerLanguageFeatures(context: vscode.ExtensionContext): void {
    const selector: vscode.DocumentSelector = { language: 'structurizr', scheme: 'file' };

    // Completion Provider
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(selector, {
            provideCompletionItems(document, position) {
                const blockContext = getBlockContext(document, position);
                const items: vscode.CompletionItem[] = [];
                const lineText = document.lineAt(position).text.substring(0, position.character).trim();

                switch (blockContext) {
                    case 'root':
                        items.push(createCompletionItem('workspace', vscode.CompletionItemKind.Keyword, 'workspace "name" "description" { ... }'));
                        break;

                    case 'workspace':
                        items.push(
                            createCompletionItem('model', vscode.CompletionItemKind.Keyword, 'model { ... }'),
                            createCompletionItem('views', vscode.CompletionItemKind.Keyword, 'views { ... }'),
                            createCompletionItem('configuration', vscode.CompletionItemKind.Keyword, 'configuration { ... }'),
                        );
                        break;

                    case 'model':
                        for (const kw of MODEL_KEYWORDS) {
                            const doc = KEYWORD_DOCS[kw];
                            items.push(createCompletionItem(kw, vscode.CompletionItemKind.Keyword, doc?.detail, doc?.documentation));
                        }
                        // Also suggest existing identifiers for relationships
                        for (const id of getElementIdentifiers(document)) {
                            items.push(createCompletionItem(id, vscode.CompletionItemKind.Variable, 'Element reference'));
                        }
                        break;

                    case 'views':
                        for (const kw of VIEW_KEYWORDS) {
                            const doc = KEYWORD_DOCS[kw];
                            items.push(createCompletionItem(kw, vscode.CompletionItemKind.Keyword, doc?.detail, doc?.documentation));
                        }
                        break;

                    case 'view':
                        for (const kw of VIEW_CONTENT_KEYWORDS) {
                            const doc = KEYWORD_DOCS[kw];
                            items.push(createCompletionItem(kw, vscode.CompletionItemKind.Keyword, doc?.detail, doc?.documentation));
                        }
                        break;

                    case 'styles':
                        for (const kw of STYLE_KEYWORDS) {
                            items.push(createCompletionItem(kw, vscode.CompletionItemKind.Keyword, `${kw} "Tag" { ... }`));
                        }
                        break;

                    case 'element':
                        // Inside a style rule — suggest properties
                        for (const prop of STYLE_PROPERTIES) {
                            items.push(createCompletionItem(prop, vscode.CompletionItemKind.Property));
                        }
                        // If the line starts with "shape", suggest shapes
                        if (lineText.startsWith('shape')) {
                            items.length = 0;
                            for (const shape of SHAPES) {
                                items.push(createCompletionItem(shape, vscode.CompletionItemKind.EnumMember));
                            }
                        }
                        break;
                }

                return items;
            },
        })
    );

    // Hover Provider
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(selector, {
            provideHover(document, position) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) return;

                const word = document.getText(range);
                const doc = KEYWORD_DOCS[word];
                if (!doc) return;

                const markdown = new vscode.MarkdownString();
                markdown.appendCodeblock(doc.detail, 'structurizr');
                markdown.appendMarkdown('\n\n' + doc.documentation);

                return new vscode.Hover(markdown, range);
            },
        })
    );

    // Document Symbol Provider (outline)
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(selector, {
            provideDocumentSymbols(document) {
                const workspace = parseDocument(document);
                const symbols: vscode.DocumentSymbol[] = [];

                // Elements
                if (workspace.elements.length > 0) {
                    const modelSymbol = new vscode.DocumentSymbol(
                        'Model',
                        '',
                        vscode.SymbolKind.Module,
                        document.lineAt(0).range,
                        document.lineAt(0).range
                    );

                    modelSymbol.children = workspace.elements.map(el => {
                        const line = document.lineAt(el.line);
                        return new vscode.DocumentSymbol(
                            el.identifier || el.name,
                            el.type + (el.name ? ` — ${el.name}` : ''),
                            el.type === 'person' ? vscode.SymbolKind.Variable : vscode.SymbolKind.Class,
                            line.range,
                            line.range
                        );
                    });

                    symbols.push(modelSymbol);
                }

                // Views
                if (workspace.views.length > 0) {
                    const viewsSymbol = new vscode.DocumentSymbol(
                        'Views',
                        '',
                        vscode.SymbolKind.Module,
                        document.lineAt(0).range,
                        document.lineAt(0).range
                    );

                    viewsSymbol.children = workspace.views.map(v => {
                        const line = document.lineAt(v.line);
                        return new vscode.DocumentSymbol(
                            v.key || v.type,
                            v.type + (v.scope ? ` (${v.scope})` : ''),
                            vscode.SymbolKind.Interface,
                            line.range,
                            line.range
                        );
                    });

                    symbols.push(viewsSymbol);
                }

                return symbols;
            },
        })
    );
}

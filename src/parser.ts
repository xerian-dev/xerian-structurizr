import * as vscode from 'vscode';

export interface ParsedElement {
    identifier: string;
    type: 'person' | 'softwareSystem' | 'container' | 'component' | 'deploymentNode' | 'infrastructureNode' | 'group';
    name: string;
    description?: string;
    technology?: string;
    line: number;
    children: ParsedElement[];
}

export interface ParsedRelationship {
    source: string;
    target: string;
    description?: string;
    technology?: string;
    line: number;
}

export interface ParsedView {
    type: 'systemLandscape' | 'systemContext' | 'container' | 'component' | 'deployment' | 'dynamic' | 'filtered' | 'custom';
    scope?: string;
    key?: string;
    line: number;
}

export interface ParsedWorkspace {
    name?: string;
    elements: ParsedElement[];
    relationships: ParsedRelationship[];
    views: ParsedView[];
}

export type BlockContext = 'root' | 'workspace' | 'model' | 'views' | 'styles' | 'element' | 'view' | 'relationship' | 'unknown';

const ELEMENT_PATTERN = /^\s*(?:(\w+)\s*=\s*)?(person|softwareSystem|softwaresystem|container|component|deploymentNode|deploymentEnvironment|infrastructureNode|group)\s+(?:"([^"]*)")?/i;

const ELEMENT_TYPE_MAP: Record<string, ParsedElement['type']> = {
    person: 'person',
    softwaresystem: 'softwareSystem',
    container: 'container',
    component: 'component',
    deploymentnode: 'deploymentNode',
    deploymentenvironment: 'deploymentNode',
    infrastructurenode: 'infrastructureNode',
    group: 'group',
};

const VIEW_TYPE_MAP: Record<string, ParsedView['type']> = {
    systemlandscape: 'systemLandscape',
    systemcontext: 'systemContext',
    container: 'container',
    component: 'component',
    deployment: 'deployment',
    dynamic: 'dynamic',
    filtered: 'filtered',
    custom: 'custom',
};
const RELATIONSHIP_PATTERN = /^\s*(\w+)\s*->\s*(\w+)\s*(?:"([^"]*)")?(?:\s+"([^"]*)")?/;
const VIEW_PATTERN = /^\s*(systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\s+(?:(\w+)\s+)?(?:"([^"]*)")?/i;

export function parseDocument(document: vscode.TextDocument): ParsedWorkspace {
    const text = document.getText();
    const lines = text.split('\n');

    const elements: ParsedElement[] = [];
    const relationships: ParsedRelationship[] = [];
    const views: ParsedView[] = [];
    let workspaceName: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed === '') {
            continue;
        }

        // Workspace name
        const workspaceMatch = trimmed.match(/^workspace\s+"([^"]*)"/i);
        if (workspaceMatch) {
            workspaceName = workspaceMatch[1];
            continue;
        }

        // Elements
        const elementMatch = trimmed.match(ELEMENT_PATTERN);
        if (elementMatch) {
            elements.push({
                identifier: elementMatch[1] || elementMatch[3]?.replace(/\s+/g, '') || '',
                type: ELEMENT_TYPE_MAP[elementMatch[2].toLowerCase()] || 'group',
                name: elementMatch[3] || '',
                line: i,
                children: [],
            });
            continue;
        }

        // Relationships
        const relMatch = trimmed.match(RELATIONSHIP_PATTERN);
        if (relMatch) {
            relationships.push({
                source: relMatch[1],
                target: relMatch[2],
                description: relMatch[3],
                technology: relMatch[4],
                line: i,
            });
            continue;
        }

        // Views
        const viewMatch = trimmed.match(VIEW_PATTERN);
        if (viewMatch) {
            views.push({
                type: VIEW_TYPE_MAP[viewMatch[1].toLowerCase()] || 'custom',
                scope: viewMatch[2],
                key: viewMatch[3],
                line: i,
            });
        }
    }

    return { name: workspaceName, elements, relationships, views };
}

export function getBlockContext(document: vscode.TextDocument, position: vscode.Position): BlockContext {
    let depth = 0;
    const contexts: string[] = [];

    for (let i = 0; i <= position.line; i++) {
        const lineText = document.lineAt(i).text;
        const trimmed = lineText.trim();

        // Skip comments
        if (trimmed.startsWith('//')) continue;

        // Track block keywords before counting braces
        if (trimmed.match(/^workspace\b/i)) contexts.push('workspace');
        else if (trimmed.match(/^model\b/i)) contexts.push('model');
        else if (trimmed.match(/^views\b/i)) contexts.push('views');
        else if (trimmed.match(/^styles\b/i)) contexts.push('styles');
        else if (trimmed.match(/^(element|relationship)\s+"/i)) contexts.push('style-rule');
        else if (trimmed.match(/^(systemLandscape|systemContext|container|component|deployment|dynamic|filtered|custom)\b/i)) contexts.push('view');

        // Count braces
        for (const ch of lineText) {
            if (ch === '{') {
                depth++;
            } else if (ch === '}') {
                depth--;
                if (contexts.length > 0) {
                    contexts.pop();
                }
            }
        }
    }

    const current = contexts[contexts.length - 1];
    if (!current) return 'root';
    if (current === 'style-rule') return 'element';

    return current as BlockContext;
}

export function getElementIdentifiers(document: vscode.TextDocument): string[] {
    const workspace = parseDocument(document);
    return workspace.elements
        .filter(e => e.identifier)
        .map(e => e.identifier);
}

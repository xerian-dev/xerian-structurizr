import * as vscode from 'vscode';
import { parseDocument, ParsedRelationship, ParsedView, ParsedWorkspace } from './parser';

interface DotConversionResult {
    code: string;
    viewName: string;
}

const AUTOLAYOUT_MAP: Record<string, string> = {
    tb: 'TB',
    bt: 'BT',
    lr: 'LR',
    rl: 'RL',
};

export function convertToDot(document: vscode.TextDocument, viewIndex?: number): DotConversionResult[] {
    const workspace = parseDocument(document);
    const results: DotConversionResult[] = [];

    if (workspace.views.length === 0) {
        results.push({
            code: generateContextDiagram(workspace, undefined, undefined),
            viewName: 'Default (all elements)',
        });
        return results;
    }

    if (viewIndex !== undefined && viewIndex < workspace.views.length) {
        const view = workspace.views[viewIndex];
        results.push({
            code: generateDiagramForView(workspace, view),
            viewName: view.key || view.type,
        });
        return results;
    }

    for (const view of workspace.views) {
        results.push({
            code: generateDiagramForView(workspace, view),
            viewName: view.key || view.type,
        });
    }

    return results;
}

function generateDiagramForView(workspace: ParsedWorkspace, view: ParsedView): string {
    switch (view.type) {
        case 'systemLandscape':
        case 'systemContext':
            return generateContextDiagram(workspace, view.scope, view.autoLayout);
        default:
            return generateContextDiagram(workspace, view.scope, view.autoLayout);
    }
}

function generateContextDiagram(workspace: ParsedWorkspace, _scope: string | undefined, autoLayout: string | undefined): string {
    const rankdir = autoLayout ? AUTOLAYOUT_MAP[autoLayout] || 'TB' : 'TB';
    const lines: string[] = [];

    lines.push('digraph {');
    lines.push(`    rankdir=${rankdir}`);
    lines.push('    node [shape=box, style="rounded,filled", fontname="Arial", fontsize=12, margin="0.3,0.2"]');
    lines.push('    edge [fontname="Arial", fontsize=10, color="#707070"]');
    lines.push('');

    for (const el of workspace.elements) {
        if (el.type === 'person') {
            const label = htmlLabel(el.name, '[Person]');
            lines.push(`    ${sanitizeId(el.identifier)} [label=${label}, fillcolor="#08427b", fontcolor="white"]`);
        }
    }

    for (const el of workspace.elements) {
        if (el.type === 'softwareSystem') {
            const label = htmlLabel(el.name, '[Software System]');
            lines.push(`    ${sanitizeId(el.identifier)} [label=${label}, fillcolor="#1168bd", fontcolor="white"]`);
        }
    }

    lines.push('');
    addRelationships(workspace.relationships, lines);

    lines.push('}');
    return lines.join('\n');
}

function addRelationships(relationships: ParsedRelationship[], lines: string[]): void {
    for (const rel of relationships) {
        const labelParts: string[] = [];
        if (rel.description) labelParts.push(escapeDotLabel(rel.description));
        if (rel.technology) labelParts.push(`[${escapeDotLabel(rel.technology)}]`);
        const label = labelParts.length > 0 ? ` [label="${labelParts.join('\\n')}"]` : '';
        lines.push(`    ${sanitizeId(rel.source)} -> ${sanitizeId(rel.target)}${label}`);
    }
}

function htmlLabel(name: string, subtitle: string): string {
    return `<<table border="0" cellborder="0" cellspacing="2"><tr><td><b>${escapeHtml(name)}</b></td></tr><tr><td><font point-size="10">${escapeHtml(subtitle)}</font></td></tr></table>>`;
}

function sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

function escapeDotLabel(text: string): string {
    return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

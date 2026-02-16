import * as vscode from 'vscode';
import { parseDocument, ParsedRelationship, ParsedView, ParsedWorkspace } from './parser';

interface MermaidConversionResult {
    code: string;
    viewName: string;
}

export function convertToMermaid(document: vscode.TextDocument, viewIndex?: number): MermaidConversionResult[] {
    const workspace = parseDocument(document);
    const results: MermaidConversionResult[] = [];

    if (workspace.views.length === 0) {
        results.push({
            code: generateContextDiagram(workspace, undefined),
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
            return generateContextDiagram(workspace, view.scope);
        case 'container':
            return generateContainerDiagram(workspace, view.scope);
        case 'component':
            return generateComponentDiagram(workspace, view.scope);
        default:
            return generateContextDiagram(workspace, view.scope);
    }
}

function generateContextDiagram(workspace: ParsedWorkspace, scope: string | undefined): string {
    const lines: string[] = ['C4Context'];

    if (workspace.name) {
        lines.push(`    title ${workspace.name}`);
    }

    for (const el of workspace.elements) {
        if (el.type === 'person') {
            lines.push(`    Person(${sanitizeId(el.identifier)}, "${el.name}")`);
        }
    }

    for (const el of workspace.elements) {
        if (el.type === 'softwareSystem') {
            if (scope && el.identifier === scope) {
                lines.push(`    System(${sanitizeId(el.identifier)}, "${el.name}")`);
            } else {
                lines.push(`    System_Ext(${sanitizeId(el.identifier)}, "${el.name}")`);
            }
        }
    }

    addRelationships(workspace.relationships, lines);
    return lines.join('\n');
}

function generateContainerDiagram(workspace: ParsedWorkspace, scope: string | undefined): string {
    const lines: string[] = ['C4Container'];

    if (workspace.name) {
        lines.push(`    title ${workspace.name} - Container Diagram`);
    }

    for (const el of workspace.elements) {
        if (el.type === 'person') {
            lines.push(`    Person(${sanitizeId(el.identifier)}, "${el.name}")`);
        }
    }

    const scopedSystem = scope
        ? workspace.elements.find(e => e.identifier === scope)
        : workspace.elements.find(e => e.type === 'softwareSystem');

    if (scopedSystem) {
        lines.push(`    System_Boundary(${sanitizeId(scopedSystem.identifier)}_boundary, "${scopedSystem.name}") {`);

        for (const el of workspace.elements) {
            if (el.type === 'container') {
                lines.push(`        Container(${sanitizeId(el.identifier)}, "${el.name}")`);
            }
        }

        lines.push('    }');
    }

    for (const el of workspace.elements) {
        if (el.type === 'softwareSystem' && el.identifier !== scope) {
            lines.push(`    System_Ext(${sanitizeId(el.identifier)}, "${el.name}")`);
        }
    }

    addRelationships(workspace.relationships, lines);
    return lines.join('\n');
}

function generateComponentDiagram(workspace: ParsedWorkspace, scope: string | undefined): string {
    const lines: string[] = ['C4Component'];

    if (workspace.name) {
        lines.push(`    title ${workspace.name} - Component Diagram`);
    }

    const scopedContainer = scope
        ? workspace.elements.find(e => e.identifier === scope)
        : workspace.elements.find(e => e.type === 'container');

    if (scopedContainer) {
        lines.push(`    Container_Boundary(${sanitizeId(scopedContainer.identifier)}_boundary, "${scopedContainer.name}") {`);

        for (const el of workspace.elements) {
            if (el.type === 'component') {
                lines.push(`        Component(${sanitizeId(el.identifier)}, "${el.name}")`);
            }
        }

        lines.push('    }');
    }

    for (const el of workspace.elements) {
        if (el.type === 'container' && el.identifier !== scope) {
            lines.push(`    Container(${sanitizeId(el.identifier)}, "${el.name}")`);
        }
    }

    addRelationships(workspace.relationships, lines);
    return lines.join('\n');
}

function addRelationships(relationships: ParsedRelationship[], lines: string[]): void {
    for (const rel of relationships) {
        const desc = rel.description ? `, "${rel.description}"` : '';
        const tech = rel.technology ? `, "${rel.technology}"` : '';
        lines.push(`    Rel(${sanitizeId(rel.source)}, ${sanitizeId(rel.target)}${desc}${tech})`);
    }
}

function sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { parseDocument } from '../parser';

const sampleDir = path.resolve(__dirname, '..', '..', 'test-samples');

async function openDslDocument(filePath: string): Promise<vscode.TextDocument> {
	const uri = vscode.Uri.file(filePath);
	const doc = await vscode.workspace.openTextDocument(uri);
	await vscode.window.showTextDocument(doc);
	return doc;
}

async function openDslContent(content: string): Promise<vscode.TextDocument> {
	const doc = await vscode.workspace.openTextDocument({
		language: 'structurizr',
		content,
	});
	await vscode.window.showTextDocument(doc);
	return doc;
}

teardown(async () => {
	await vscode.commands.executeCommand('workbench.action.closeAllEditors');
});

suite('Parser', () => {
	suite('example.strz', () => {
		test('parses workspace name', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'example.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.name, 'Big Bank plc');
		});

		test('parses all 9 elements', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'example.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.elements.length, 9);

			const ids = result.elements.map(e => e.identifier);
			assert.ok(ids.includes('customer'));
			assert.ok(ids.includes('supportStaff'));
			assert.ok(ids.includes('internetBankingSystem'));
			assert.ok(ids.includes('webApp'));
			assert.ok(ids.includes('signinController'));
			assert.ok(ids.includes('accountsController'));
			assert.ok(ids.includes('spa'));
			assert.ok(ids.includes('database'));
			assert.ok(ids.includes('mainframe'));
		});

		test('does not produce elements with empty identifiers', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'example.strz'));
			const result = parseDocument(doc);
			const emptyIds = result.elements.filter(e => e.identifier === '');
			assert.strictEqual(emptyIds.length, 0, `Found elements with empty identifiers on lines: ${emptyIds.map(e => e.line + 1).join(', ')}`);
		});

		test('parses all 5 relationships', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'example.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.relationships.length, 5);
		});

		test('parses all 4 views', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'example.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.views.length, 4);

			const viewTypes = result.views.map(v => v.type);
			assert.ok(viewTypes.includes('systemLandscape'));
			assert.ok(viewTypes.includes('systemContext'));
			assert.ok(viewTypes.includes('container'));
			assert.ok(viewTypes.includes('component'));
		});
	});

	suite('system-context.strz', () => {
		test('parses workspace name', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.name, 'Name');
		});

		test('parses 2 elements', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.elements.length, 2);

			const ids = result.elements.map(e => e.identifier);
			assert.ok(ids.includes('u'));
			assert.ok(ids.includes('ss'));

			const user = result.elements.find(e => e.identifier === 'u')!;
			assert.strictEqual(user.type, 'person');
			assert.strictEqual(user.name, 'User');

			const sys = result.elements.find(e => e.identifier === 'ss')!;
			assert.strictEqual(sys.type, 'softwareSystem');
			assert.strictEqual(sys.name, 'Software System');
		});

		test('parses 1 relationship', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.relationships.length, 1);
			assert.strictEqual(result.relationships[0].source, 'u');
			assert.strictEqual(result.relationships[0].target, 'ss');
			assert.strictEqual(result.relationships[0].description, 'Uses');
		});

		test('parses 1 systemContext view', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.views.length, 1);
			assert.strictEqual(result.views[0].type, 'systemContext');
			assert.strictEqual(result.views[0].scope, 'ss');
			assert.strictEqual(result.views[0].key, 'Diagram1');
		});
	});

	suite('autoLayout parsing', () => {
		test('parses autoLayout lr from system-context.strz', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const result = parseDocument(doc);
			assert.strictEqual(result.views[0].autoLayout, 'lr');
		});

		test('parses autoLayout tb', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    u = person "User"',
				'  }',
				'  views {',
				'    systemLandscape "Key" {',
				'      include *',
				'      autoLayout tb',
				'    }',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const result = parseDocument(doc);
			assert.strictEqual(result.views[0].autoLayout, 'tb');
		});

		test('autoLayout is undefined when not specified', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    u = person "User"',
				'  }',
				'  views {',
				'    systemLandscape "Key" {',
				'      include *',
				'    }',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const result = parseDocument(doc);
			assert.strictEqual(result.views[0].autoLayout, undefined);
		});
	});

	suite('context-aware parsing', () => {
		test('container in views is a view, not an element', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    sys = softwareSystem "Sys" {',
				'      web = container "Web" "desc" "tech"',
				'    }',
				'  }',
				'  views {',
				'    container sys "Containers" {',
				'      include *',
				'    }',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const result = parseDocument(doc);

			assert.strictEqual(result.elements.length, 2, 'Expected 2 elements (sys + web)');
			assert.strictEqual(result.views.length, 1, 'Expected 1 view');
			assert.strictEqual(result.views[0].type, 'container');
			assert.strictEqual(result.views[0].scope, 'sys');
		});

		test('component in views is a view, not an element', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    sys = softwareSystem "Sys" {',
				'      web = container "Web" {',
				'        ctrl = component "Controller" "desc"',
				'      }',
				'    }',
				'  }',
				'  views {',
				'    component web "Components" {',
				'      include *',
				'    }',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const result = parseDocument(doc);

			assert.strictEqual(result.elements.length, 3, 'Expected 3 elements (sys + web + ctrl)');
			assert.strictEqual(result.views.length, 1, 'Expected 1 view');
			assert.strictEqual(result.views[0].type, 'component');
			assert.strictEqual(result.views[0].scope, 'web');
		});

		test('relationships are only parsed inside model', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    a = softwareSystem "A"',
				'    b = softwareSystem "B"',
				'    a -> b "Uses"',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const result = parseDocument(doc);

			assert.strictEqual(result.relationships.length, 1);
			assert.strictEqual(result.relationships[0].source, 'a');
			assert.strictEqual(result.relationships[0].target, 'b');
		});
	});
});

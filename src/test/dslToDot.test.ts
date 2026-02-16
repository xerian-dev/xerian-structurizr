import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { convertToDot } from '../dslToDot';

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

suite('DOT Generation', () => {
	suite('system-context.strz', () => {
		test('produces 1 result with correct viewName', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const results = convertToDot(doc);
			assert.strictEqual(results.length, 1);
			assert.strictEqual(results[0].viewName, 'Diagram1');
		});

		test('output contains rankdir=LR from autoLayout lr', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const results = convertToDot(doc);
			assert.ok(results[0].code.includes('rankdir=LR'));
		});

		test('output contains Person node for u', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const results = convertToDot(doc);
			assert.ok(results[0].code.includes('u ['));
			assert.ok(results[0].code.includes('User'));
			assert.ok(results[0].code.includes('[Person]'));
		});

		test('output contains Software System node for ss', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const results = convertToDot(doc);
			assert.ok(results[0].code.includes('ss ['));
			assert.ok(results[0].code.includes('Software System'));
			assert.ok(results[0].code.includes('[Software System]'));
		});

		test('output contains edge from u to ss', async () => {
			const doc = await openDslDocument(path.join(sampleDir, 'system-context.strz'));
			const results = convertToDot(doc);
			assert.ok(results[0].code.includes('u -> ss'));
			assert.ok(results[0].code.includes('Uses'));
		});
	});

	suite('autoLayout directions', () => {
		test('defaults to TB when no autoLayout specified', async () => {
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
			const results = convertToDot(doc);
			assert.ok(results[0].code.includes('rankdir=TB'));
		});

		test('maps autoLayout rl to rankdir=RL', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    u = person "User"',
				'  }',
				'  views {',
				'    systemLandscape "Key" {',
				'      include *',
				'      autoLayout rl',
				'    }',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const results = convertToDot(doc);
			assert.ok(results[0].code.includes('rankdir=RL'));
		});
	});

	suite('no views', () => {
		test('generates default diagram when no views defined', async () => {
			const content = [
				'workspace "Test" {',
				'  model {',
				'    u = person "User"',
				'    s = softwareSystem "System"',
				'    u -> s "Uses"',
				'  }',
				'}',
			].join('\n');
			const doc = await openDslContent(content);
			const results = convertToDot(doc);
			assert.strictEqual(results.length, 1);
			assert.strictEqual(results[0].viewName, 'Default (all elements)');
			assert.ok(results[0].code.includes('u -> s'));
		});
	});
});

import * as assert from 'node:assert/strict';
import * as vscode from 'vscode';

import { FixinatorCommand } from '../utils/FixinatorCommand';
import { activateExtension, getDocumentUri, sleep } from './helper';

suite('Extension Test Suite', () => {
	const TIMEOUT = 20_000;

	teardown(async () => {
		await vscode.commands.executeCommand("workbench.action.closeAllEditors");
	});

	test.skip('FixinatorCommand results() should return the results', () => {
		const fixinatorCommand = new FixinatorCommand();
		const results = fixinatorCommand.results;

		assert.match(results, /categories/);
	});

	test('Should provide diagnostics', async () => {
		await activateExtension();

		const documentUri = getDocumentUri('diagnostics.cfm');
		const document = await vscode.workspace.openTextDocument(documentUri);
		await vscode.window.showTextDocument(document);

		const editor = vscode.window.activeTextEditor;
		assert.ok(editor, 'No active text editor');
		assert.ok(
			editor.document.uri.fsPath.endsWith('diagnostics.cfm'),
			'Active text editor is not diagnostics.cfm',
		);

		await vscode.commands.executeCommand('fixinator.scan');

		let actualDiagnostics = vscode.languages.getDiagnostics(documentUri);
		if (actualDiagnostics.length === 0) {
			let timeout = TIMEOUT;
			while (actualDiagnostics.length === 0 && timeout > 0) {
				await sleep(100);
				actualDiagnostics = vscode.languages.getDiagnostics(documentUri);
				timeout -= 100;
			}
			assert.ok(
				actualDiagnostics.length > 0,
				`No diagnostics provided in ${TIMEOUT}ms`,
			);
		}

		actualDiagnostics.sort((a, b) => {
			return a.range.start.compareTo(b.range.start);
		});

		const expectedDiagnostics = [
			{
				message: 'SQL Injection finding on line 3 of diagnostics.cfm',
				range: new vscode.Range(2, 12, 2, 16),
				severity: vscode.DiagnosticSeverity.Error,
				code: 'sqlinjection',
				source: 'fixinator',
			},
			{
				message: 'Unscoped Variable finding on line 3 of diagnostics.cfm',
				range: new vscode.Range(2, 13, 2, 15),
				severity: vscode.DiagnosticSeverity.Information,
				code: 'unscoped-variable',
				source: 'fixinator',
			},
		];

		assert.partialDeepStrictEqual(
			actualDiagnostics,
			expectedDiagnostics,
			'Diagnostics don\'t match',
		);
	});
});

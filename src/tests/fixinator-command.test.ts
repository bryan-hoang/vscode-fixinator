import * as assert from 'node:assert';
import * as vscode from 'vscode';

import { FixinatorCommand } from '../utils/FixinatorCommand';
import { activateExtension, getDocumentUri, sleep, toRange } from './helper';

suite('Extension Test Suite', () => {
	const TIMEOUT = 10000;

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
				message: 'SQL Injection finding on line 3 of diagnostics.',
				range: toRange(3, 13, 3, 13),
				severity: vscode.DiagnosticSeverity.Warning,
			},
		];

		assert.equal(actualDiagnostics.length, expectedDiagnostics.length);
		actualDiagnostics.forEach((actualDiagnostic, i) => {
			const expectedDiagnostic = expectedDiagnostics[i];
			assert.deepEqual(
				new vscode.Diagnostic(
					actualDiagnostic.range,
					actualDiagnostic.message,
					actualDiagnostic.severity,
				),
				expectedDiagnostic,
			);
		});
	});
});

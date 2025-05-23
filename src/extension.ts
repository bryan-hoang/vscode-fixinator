// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Logger from './utils/logger';
import { FixinatorCommand } from './utils/FixinatorCommand';
import { spawn } from 'child_process';
import path = require('path');
import * as os from 'os';
import { readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import { FixinatorQuickFixProvider } from './FixinatorQuickFixProvider';

const outputChannel = vscode.window.createOutputChannel('Fixinator', "cfml");

const logger = new Logger('Fixinator', outputChannel);



// Remaps the severity from Fixinator to VSCode
const severityMap = {
	"3": vscode.DiagnosticSeverity.Error,
	"2": vscode.DiagnosticSeverity.Warning,
	"1": vscode.DiagnosticSeverity.Information,
	"0": vscode.DiagnosticSeverity.Hint
};

let diagnosticCollection: vscode.DiagnosticCollection;
const diagnosticDataMap = new WeakMap<vscode.Diagnostic, any>(); //Thbis is any as we dont have an object for a fixinator result yet.

export async function activate(context: vscode.ExtensionContext) {


	context.subscriptions.push(outputChannel);

	diagnosticCollection = vscode.languages.createDiagnosticCollection('Fixinator');
	context.subscriptions.push(diagnosticCollection);

	context.subscriptions.push(vscode.commands.registerCommand('vscode-fixinator.scan', async () => {
		const editor = vscode.window.activeTextEditor;

		if (editor && editor.document.languageId === 'cfml') {
			const document = editor.document;
			const filePath = document.uri.fsPath;

			diagnosticCollection.clear();
			// Add it to the output channel
			logger.log(`Fixinator is scanning  ${filePath}`);
			outputChannel.appendLine(`Fixinator is scanning  ${filePath}`);
			// vscode.window.showInformationMessage(`Fixinator is scanning  ${filePath}`);
			// runBoxFinxinatorScan(filePath);
			await runFixinatorScan(filePath);

		}
		else {
			vscode.window.showInformationMessage(`Fixinator is not available for this file type [${editor.document.languageId}]`);
		}
	}));

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			'*.cfm,*.cfc',
			new FixinatorQuickFixProvider(diagnosticDataMap, diagnosticCollection),
			{ providedCodeActionKinds: FixinatorQuickFixProvider.providedCodeActionKinds }
		)
	);


	context.subscriptions.push(
		vscode.commands.registerCommand('fixinator.applyFix', async (uri: vscode.Uri, diagnostic: vscode.Diagnostic, fix: any) => {
			// console.log("fix", fix);
			const edit = new vscode.WorkspaceEdit();
			const fixcode = fix.fixCode || fix.FIXCODE;
			edit.replace(uri, diagnostic.range, fixcode);
			const success = await vscode.workspace.applyEdit(edit);
			if (success) {
				const diagnostics = diagnosticCollection.get(uri) || [];
				const updatedDiagnostics = diagnostics.filter(d => d !== diagnostic);
				diagnosticCollection.set(uri, updatedDiagnostics);
				console.log("Code action executed and diagnostic updated.");

			}
		})
	);


	vscode.workspace.onDidSaveTextDocument((document) => {
		const { scanOnSave } = getSettings();
		if (!scanOnSave) {
			return;
		}
		if (document.languageId !== 'cfml') {
			return;
		}
		const filePath = document.uri.fsPath;

		diagnosticCollection.clear();
		const message = vscode.window.showInformationMessage(`Fixinator is scanning  ${filePath}`);
		runFixinatorScan(filePath);
	});


	logger.log('Fixinator extension started');
}


async function runFixinatorScan(filePath: string) {
	const { useCommandbox } = getSettings();
	if (useCommandbox) {
		return runBoxFinxinatorScan(filePath);
	}

	return runHTTPSFixinitatorScan(filePath);
}

async function runHTTPSFixinitatorScan(filePath: string) {

	// logger.log("Starting HTTPS Scan");
	const payload = {};
	const text = await vscode.workspace.openTextDocument(filePath).then((document) => {
		return document.getText();
	});
	payload['files'] = [{ path: filePath, data: text }];
	payload['config'] = {};
	payload['categories'] = false;



	const { apiKey, endpoint } = getSettings();
	// logger.info(`Running Fixinator scan to ${endpoint}`);
	// Now fetch this via post
	const headers = {
		'Content-Type': 'application/json',
		"x-api-key": apiKey
	};

	// logger.log({ endpoint, headers, payload });

	fetch(endpoint, {
		headers,
		method: 'POST',
		body: JSON.stringify(payload)
	}).then(response => {

		// logger.info(`Running got the response ${JSON.stringify(response)}`);
		if (response.ok) {
			// vscode.window.showInformationMessage('Fixinator scan complete!');
			return response.json();
		} else {
			// logger.error(response);
			if (response.status >= 400 && response.status < 500) {
				logger.error({ info: "Fixnator scan rejected by server", response });
				vscode.window.showErrorMessage('Fixinator scan failed! Check your API Key and Endpoint');
				throw new Error('Fixinator Scan rejected by server');
			}
			// vscode.window.showErrorMessage(`Fixinator scan failed! ${response.statusText}`);
			throw new Error('Fixinator scan failed!');
		}
	}).then(async (data) => {
		// console.log(data);
		const results = data.results || [];
		// logger.log(`Found ${results.length} issues`);
		const diagnosisForFile = [];
		for (const resid in data.results) {
			const result = data.results[resid];
			const diagnosis = await createDiagnosticFromResult(filePath, result);
			diagnosisForFile.push(diagnosis);
		}
		diagnosticCollection.set(vscode.Uri.file(filePath), diagnosisForFile);

	}).catch(error => {
		logger.error(error);
		vscode.window.showErrorMessage(`Fixinator scan failed! ${error.message}`);
		console.error(error);
	}
	).finally(() => {
		// logger.log("Finished HTTPS Scan");
	});


}
function runBoxFinxinatorScan(filePath: string) {

	logger.log("Starting Box Fixinator Scan");
	const result = spawn('box', ['fixinator', `path=${filePath}`, 'verbose=false', 'failOnIssues=false', 'json=true'], { cwd: vscode.workspace.rootPath });

	let responseData = '';
	result.addListener('exit', async (code) => {

		if (responseData === '') {
			vscode.window.showErrorMessage('Fixinator scan failed!');
			return;
		}
		if (code === 0) {
			vscode.window.showInformationMessage('Fixinator scan complete!');
		} else {
			vscode.window.showErrorMessage('Fixinator scan failed!');
			return;
		}

		const diagnosisForFile = [];
		const scan = JSON.parse(responseData);

		for (const result of scan.results) {
			const diagnosis = await createDiagnosticFromResult(filePath, result);
			diagnosisForFile.push(diagnosis);
		}
		diagnosticCollection.set(vscode.Uri.file(filePath), diagnosisForFile);




	});

	result.stderr.on('data', (data) => {
		logger.error(data.toString());
	});

	result.stdout.on('data', async (data) => {
		responseData += data.toString();
	});
}

async function createDiagnosticFromResult(path: string, result: any): Promise<vscode.Diagnostic> {

	console.log("createDiagnosticFromREsult", path, result);
	// Read the contents of a file and find the location of the error
	const diagnostic = await vscode.workspace.openTextDocument(path).then((document) => {

		const line = Math.max(0, result.line - 1);
		const column = Math.max(0, result.column - 1);

		const TheLine = document.lineAt(line);

		
		let startPosition: vscode.Position = new vscode.Position(line, TheLine.firstNonWhitespaceCharacterIndex);
		let endPosition: vscode.Position = new vscode.Position(line, TheLine.range.end.character);
		// let endPosition: vscode.Position = startPosition.translate(0, Math.max(0, result.context.length - 2));
		let title = result.title || result.TITLE;
		// if we are plain-text-key, the context doesnt return the key! 
		// So we have to select to the end of the line. 
		if (result.id === "plain-text-key") {
			// const lineInfo = document.lineAt(line);
			// const lineText = lineInfo.text;
			// const key = lineText.substring(column, lineText.length);
			// const keyLength = key.length;
			// endPosition = startPosition.translate(0, keyLength);
		}

		if (result.fixes && result.fixes.length > 0) {
			const fix = result.fixes[0];
			const replacestring = fix.replaceString || fix.REPLACESTRING;
			const replacePosition = fix.replacePosition || fix.REPLACEPOSITION;

			const pos = Math.max(0, replacePosition - 1);
			startPosition = document.positionAt(pos);
			endPosition = startPosition.translate(0, replacestring.length);
			result.title += ` 🛠️`;
		}

		let range = new vscode.Range(
			startPosition,
			endPosition
		);


		const vscodeDiagnostic = new vscode.Diagnostic(range, result.message, severityMap[result.severity]);
		vscodeDiagnostic.source = 'fixinator';
		if (result.link && result.title) {
			vscodeDiagnostic.code = {
				value: result.title,
				target: vscode.Uri.parse(result.link),
			};
		}
		else {
			vscodeDiagnostic.code = result.title;
		}


		return vscodeDiagnostic;
	});

	diagnosticDataMap.set(diagnostic, result);
	return diagnostic;

}


function getSettings() {
	const settings = vscode.workspace.getConfiguration('fixinator');
	const endpoint: string = settings.get('endpoint') || 'https://api.fixinator.app/v1/scan';
	const apiKey: string = settings.get('apiKey');
	const scanOnSave = settings.get('scanOnSave');
	const useCommandbox = settings.get('useCommandbox');
	return { endpoint, apiKey, scanOnSave, useCommandbox };
}

// This method is called when your extension is deactivated
export function deactivate() { }



// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { FixinatorQuickFixProvider } from './FixinatorQuickFixProvider';
import { FixinatorCommand } from './utils/FixinatorCommand';
import Logger from './utils/logger';
import { fixDriveCasingInWindows, getWorkspaceFolderPath } from './utils/path';

const logger = new Logger('Fixinator');

// Remaps the severity from Fixinator to VSCode
const severityMap = {
	"3": vscode.DiagnosticSeverity.Error,
	"2": vscode.DiagnosticSeverity.Warning,
	"1": vscode.DiagnosticSeverity.Information,
	"0": vscode.DiagnosticSeverity.Hint
};

let diagnosticCollection: vscode.DiagnosticCollection;
const diagnosticDataMap = new WeakMap<vscode.Diagnostic, any>(); //Thbis is any as we dont have an object for a fixinator result yet.
const coldFusionLanguageId = "cfml";

function isColdFusionDocument(document: vscode.TextDocument) {
	return document.languageId === coldFusionLanguageId;
}

export async function activate(context: vscode.ExtensionContext) {
	logger.info('Fixinator extension started');

	// Make sure that these channels are disposed when the extension is deactivated.
	context.subscriptions.push(logger.outputChannel);

	diagnosticCollection = vscode.languages.createDiagnosticCollection('Fixinator');
	context.subscriptions.push(diagnosticCollection);

	context.subscriptions.push(vscode.commands.registerCommand('fixinator.scan', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active text editor to perform scan on');
			return;
		}

		if (isColdFusionDocument(editor.document)) {
			const document = editor.document;
			diagnosticCollection.clear();
			await runFixinatorScan(document.uri);
		} else {
			vscode.window.showInformationMessage(`Fixinator is not available for this file type [${editor.document.languageId}]`);
		}
	}));

	context.subscriptions.push(vscode.commands.registerCommand('fixinator.scan-all', () => {

		// We should check for fixinator key or fixinator endpoint here, as we are rate limited to 20 scan per hour.
		// const { apiKey, endpoint } = getSettings();
		// if (!apiKey || !endpoint) {
		// 	vscode.window.showWarningMessage('Fixinator API Key or Endpoint is not set. Please set it in the settings.');
		// 	return;
		// }

		//get all the files in the workspace
		const files = vscode.workspace.findFiles("**/*.cf*", "**/node_modules/**,**/dist/**,**/out/**,**/build/**,**/.git/**,**/.svn/**,**/.hg/**,**/.idea/**,**/.vscode/**,**/.history/**", 1000);

		files.then((uris) => {
			diagnosticCollection.clear();
			// Add it to the output channel
			// logger.log(`l Fixinator is scanning  ${filePath}`);
			// outputChannel.appendLine(`Fixinator is scanning  ${filePath}`);
			// vscode.window.showInformationMessage(`Fixinator is scanning  ${filePath}`);
			// runBoxFinxinatorScan(filePath);
			uris.forEach((uri) => {
				runFixinatorScan(uri);
			});
		}
		);
	}));

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			{ scheme: 'file', language: 'cfml' },
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

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument((document) => {
			const { scanOnSave } = getSettings(document.uri);
			if (!scanOnSave || !isColdFusionDocument(document)) {
				return;
			}

			diagnosticCollection.clear();
			runFixinatorScan(document.uri);
		}),
	);
}

async function runFixinatorScan(textDocumentUri: vscode.Uri): Promise<void> {
	const filePath = textDocumentUri.fsPath;
	vscode.window.showInformationMessage(
		`Fixinator is scanning ${filePath}`,
	);

	const { useCommandbox } = getSettings(textDocumentUri);
	if (useCommandbox) {
		await runBoxFinxinatorScan(textDocumentUri);
	} else {
		await runHTTPSFixinitatorScan(textDocumentUri);
	}
}

async function runHTTPSFixinitatorScan(textDocumentUri: vscode.Uri) {
	const { apiKey, endpoint, fixinatorConfig } = getSettings(textDocumentUri);
	const filePath = fixDriveCasingInWindows(textDocumentUri.fsPath);
	const cwd = getWorkspaceFolderPath(textDocumentUri);
	assert(typeof cwd === 'string');

	logger.info(`Running HTTPS scan on ${filePath} using ${endpoint}`);

	// logger.log("Starting HTTPS Scan");
	const payload = {};
	const text = await vscode.workspace.openTextDocument(filePath).then((document) => {
		return document.getText();
	});
	payload['files'] = [{ path: filePath, data: text }];
	payload['config'] = {};
	payload['categories'] = false;

	// Now fetch this via post
	const headers = {
		// eslint-disable-next-line @typescript-eslint/naming-convention
		'Content-Type': 'application/json',
		// eslint-disable-next-line @typescript-eslint/naming-convention
		"x-api-key": apiKey
	};

	logger.trace('Making request with payload', payload);

	await fetch(endpoint, {
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
		logger.log(`Found ${results.length} issues`);
		console.log({results});
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

function runBoxFinxinatorScan(textDocumentUri: vscode.Uri) {
	return new Promise<void>((resolve, reject) => {
		const { configFile, customBoxArgs } = getSettings(textDocumentUri);
		const filePath = fixDriveCasingInWindows(textDocumentUri.fsPath);
		const cwd = getWorkspaceFolderPath(textDocumentUri);
		assert(typeof cwd === 'string');

		logger.info(`Starting CommandBox scan on ${filePath}`);

		const command = 'box';
		const args = [
			'fixinator',
			'json=true',
			'failOnIssues=false',
		];
		if (configFile.length > 0) {
			args.push(`configFile=${configFile}`);
		}
		if (customBoxArgs.length > 0) {
			args.push(...customBoxArgs);
		}
		args.push(`path=${filePath}`);

		logger.debug(`Spawn: (cwd=${cwd}) ${command} ${args.join(' ')}`);
		const result = spawn(command, args, { cwd });

		let responseData = '';

		result.stdout.on('data', (data) => {
			responseData += data.toString();
		});

		result.stderr.on('data', (data) => {
			logger.error(data.toString());
		});

		result.addListener('exit', async (code) => {
			if (responseData === '' || code !== 0) {
				const error = new Error('Fixinator scan failed!', { cause: { responseData, code } });
				vscode.window.showErrorMessage(error.message);
				reject(error);
			}

			const diagnosisForFile = [];
			let scan;

			try {
				scan = JSON.parse(responseData);
			} catch (error) {
				logger.error({ error, responseData });
				reject(error);
			}

			logger.info(`Found ${scan.results.length} issues in ${filePath}`);
			logger.trace('CommandBox scan results:', scan.results);

			for (const result of scan.results) {
				const diagnosis = await createDiagnosticFromResult(filePath, result);
				diagnosisForFile.push(diagnosis);
			}
			diagnosticCollection.set(vscode.Uri.file(filePath), diagnosisForFile);

			logger.info(`Finished CommandBox scan on ${filePath}`);
			resolve();
		});
	});
}

async function createDiagnosticFromResult(path: string, result: any): Promise<vscode.Diagnostic> {
	// console.log("createDiagnosticFromREsult", path, result);
	// Read the contents of a file and find the location of the error
	const diagnostic = await vscode.workspace.openTextDocument(path).then((document) => {
		let line = Math.max(0, result.line - 1);
		const TheLine = document.lineAt(line);
		const firstNonWhitespaceCharacterIndex = TheLine.firstNonWhitespaceCharacterIndex;
		// const startofLine = TheLine.text.substring(0, firstNonWhitespaceCharacterIndex);
		let column:number = (result.column || 1);
			column = firstNonWhitespaceCharacterIndex + column;
		// column = column - tabCount + (tabCount * tabsize);
		// This fixes for some of the issues we have with the position being off
		if (result.id === "plain-text-key") {
			// const position = document.positionAt(result.position);
			// line = position.line;
			// column = position.character;
		}

		const endColumn = Math.max(0, column + result.context.length);
		const endLine = line; //how about multiline lines?

		// let startPosition: vscode.Position = new vscode.Position(line, TheLine.firstNonWhitespaceCharacterIndex);
		// let endPosition: vscode.Position = new vscode.Position(line, TheLine.range.end.character);
		let startPosition: vscode.Position = new vscode.Position(line, column);
		let endPosition: vscode.Position = new vscode.Position(endLine, endColumn);
		// let endPosition: vscode.Position = startPosition.translate(0, Math.max(0, result.context.length - 2));
		let title = result.title || result.TITLE;

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

		const vscodeDiagnostic = new vscode.Diagnostic(range, result.message, severityMap[result.severity as keyof typeof severityMap]);
		vscodeDiagnostic.source = 'fixinator';
		if (result.link) {
			vscodeDiagnostic.code = {
				value: result.id,
				target: vscode.Uri.parse(result.link),
			};
		} else {
			vscodeDiagnostic.code = result.id;
		}

		return vscodeDiagnostic;
	});

	diagnosticDataMap.set(diagnostic, result);
	return diagnostic;
}

function getSettings(textDocumentUri?: vscode.Uri) {
	logger.trace('Getting settings');
	const settings = vscode.workspace.getConfiguration('fixinator', textDocumentUri);

	const endpoint: string = settings.get('endpoint') || 'https://api.fixinator.app/v1/scan';
	const apiKey: string = settings.get('apiKey') || '';
	const scanOnSave: boolean = Boolean(settings.get('scanOnSave'));
	const useCommandbox: boolean = Boolean(settings.get('useCommandbox'));
	const customBoxArgs: string[] = settings.get('customBoxArgs') || [];
	const configFile: string = settings.get('configFile') || '';

	const cwd = getWorkspaceFolderPath(textDocumentUri);
	assert(typeof cwd === 'string');

	// Check config file if specified.
	let resolvedConfigFile = configFile;
	let fixinatorConfig: any = {};
	if (configFile.length > 0) {
		if (!path.isAbsolute(configFile)) {
			resolvedConfigFile = path.resolve(cwd, configFile);
		}

		logger.trace({ resolvedConfigFile });

		if (!fs.existsSync(resolvedConfigFile)) {
			const error = new Error(`Specified Fixinator config file \`${configFile}\` does not exist`);
			vscode.window.showErrorMessage(error.message);
			throw error;
		}

		try {
			fixinatorConfig = JSON.parse(String(fs.readFileSync(resolvedConfigFile)));
		} catch (e) {
			const error = new Error(`Cannot parse Fixinator config file \`${configFile}\``, { cause: e });
			logger.error(error.message);
			vscode.window.showErrorMessage(error.message);
			throw error;
		}
	}

	const extensionConfig = {
		endpoint,
		apiKey,
		scanOnSave,
		useCommandbox,
		configFile,
		resolvedConfigFile,
		fixinatorConfig,
		customBoxArgs,
	};
	logger.trace({ extensionConfig });
	return extensionConfig;
}

// This method is called when your extension is deactivated
export function deactivate() { }

import * as path from 'node:path';
import * as vscode from 'vscode';

const EXTENSION_ID = 'markdrew.vscode-fixinator';

export async function activateExtension() {
	const extension = vscode.extensions.getExtension(EXTENSION_ID);
	if (extension === undefined) {
		throw new Error(`Extension ${EXTENSION_ID} not found`);
	}
	try {
		await extension.activate();
	} catch (e) {
		console.error(`Failed to activate the extension: ${e}`);
	}
}

export const getDocumentUri = (p: string) => {
	return vscode.Uri.file(getDocumentPath(p));
};

export const getDocumentPath = (p: string) => {
	return path.resolve(__dirname, '../../src/tests/fixtures', p);
};

export async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

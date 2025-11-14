import { platform } from 'node:process';
import * as vscode from 'vscode';

function isFileUriScheme(uri: vscode.Uri): boolean {
	return uri.scheme === 'file';
}

// Stolen from vscode-go: https://github.com/microsoft/vscode-go/blob/d6a0fac4d1722367c9496fb516d2d05ec887fbd3/src/goPath.ts#L193
// Workaround for issue in https://github.com/Microsoft/vscode/issues/9448#issuecomment-244804026
export function fixDriveCasingInWindows(pathToFix: string): string {
	return platform === 'win32' && pathToFix
		? pathToFix.substring(0, 1).toUpperCase() + pathToFix.substring(1)
		: pathToFix;
}

export function getWorkspaceFolderPath(
	uri?: vscode.Uri,
	requireFileUri: boolean = true,
): string | undefined {
	const isSafeUriSchemeFunc = requireFileUri ? isFileUriScheme : () => true;
	if (uri) {
		const workspace = vscode.workspace.getWorkspaceFolder(uri);
		if (workspace && isSafeUriSchemeFunc(workspace.uri)) {
			return fixDriveCasingInWindows(workspace.uri.fsPath);
		}
	}

	// fall back to the first workspace if available
	const folders = vscode.workspace.workspaceFolders;
	if (folders?.length) {
		// Only file uris are supported
		const folder = folders.find((folder) => isSafeUriSchemeFunc(folder.uri));
		if (folder) {
			return fixDriveCasingInWindows(folder.uri.fsPath);
		}
	}
}

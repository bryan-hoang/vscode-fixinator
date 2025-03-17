import * as vscode from 'vscode';

export class FixinatorQuickFixProvider implements vscode.CodeActionProvider {

    private diagnosticDataMap: WeakMap<vscode.Diagnostic, any>;
    private diagnosticCollection: vscode.DiagnosticCollection;
    // Specify that this provider offers quick fixes.
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    constructor(diagnosticDataMap: WeakMap<vscode.Diagnostic, any>, diagnosticCollection: vscode.DiagnosticCollection) {
        this.diagnosticDataMap = diagnosticDataMap;
        this.diagnosticCollection = diagnosticCollection;
    }
    // This method is called by VS Code to fetch code actions.
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.CodeAction[] | undefined {
        // Filter diagnostics in the given context that you want to fix.
        const fixableDiagnostics = context.diagnostics.filter(diag => {
            console.log("should we provide a fix for this diagnostic?", diag);

            const originalResult = this.diagnosticDataMap.get(diag);
            return originalResult && originalResult.fixes;
        });

        const actions: vscode.CodeAction[] = [];

        for (const diagnostic of fixableDiagnostics) {
            for (const fix of this.diagnosticDataMap.get(diagnostic).fixes) {
                const title = fix.fixCode || fix.FIXCODE;
                const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);

                action.command = {
                    command: 'fixinator.applyFix',
                    title: 'Apply Fix',
                    arguments: [document.uri, diagnostic, fix]
                };

                action.diagnostics = [diagnostic];
                actions.push(action);

            }
        }
        return actions;
    }
}
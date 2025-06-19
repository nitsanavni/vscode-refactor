import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('cosmic-zebra-refactor.quantumSplit', () => {
        vscode.window.showInformationMessage('Quantum Split Analysis activated! 🦓⚡');
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

import * as http from "node:http";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
	console.log("Cosmic Zebra Refactor extension activated!");

	const disposable = vscode.commands.registerCommand(
		"cosmic-zebra-refactor.quantumSplit",
		() => {
			console.log("quantumSplit command executed!");
			vscode.window.showInformationMessage(
				"Quantum Split Analysis activated! 🦓⚡",
			);
		},
	);

	// HTTP server for CLI triggers
	const server = http.createServer((req, res) => {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Content-Type", "application/json");

		if (req.url === "/quantumSplit" && req.method === "POST") {
			console.log("HTTP trigger received for quantumSplit");
			vscode.commands.executeCommand("cosmic-zebra-refactor.quantumSplit");
			res.writeHead(200);
			res.end(JSON.stringify({ success: true, message: "Command executed" }));
		} else if (req.url === "/health" && req.method === "GET") {
			res.writeHead(200);
			res.end(
				JSON.stringify({ status: "ok", extension: "cosmic-zebra-refactor" }),
			);
		} else {
			res.writeHead(404);
			res.end(JSON.stringify({ error: "Not found" }));
		}
	});

	const port = 3141;
	server.listen(port, "localhost", () => {
		console.log(`Cosmic Zebra Refactor HTTP server listening on port ${port}`);
		vscode.window.showInformationMessage(
			`Extension HTTP server started on port ${port}`,
		);
	});

	context.subscriptions.push(disposable, { dispose: () => server.close() });
}

export function deactivate() {}

import * as http from "node:http";
import * as vscode from "vscode";

// Helper function to find symbol by name in document symbols
function findSymbolByName(
  symbols: vscode.DocumentSymbol[],
  targetName: string,
): vscode.DocumentSymbol | null {
  for (const symbol of symbols) {
    if (symbol.name === targetName) {
      return symbol;
    }
    // Recursively search children
    if (symbol.children && symbol.children.length > 0) {
      const found = findSymbolByName(symbol.children, targetName);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

// Rename symbol using WorkspaceEdit API (method #1)
async function renameSymbol(
  uri: vscode.Uri,
  position: vscode.Position,
  newName: string,
): Promise<boolean> {
  try {
    // Get rename edits from language service
    const workspaceEdit =
      await vscode.commands.executeCommand<vscode.WorkspaceEdit>(
        "vscode.executeDocumentRenameProvider",
        uri,
        position,
        newName,
      );

    if (workspaceEdit) {
      // Apply the rename across workspace
      const success = await vscode.workspace.applyEdit(workspaceEdit);
      return success;
    }
    return false;
  } catch (error) {
    console.error("Error in renameSymbol:", error);
    return false;
  }
}

// Find and rename symbol using Document Symbol Provider (method #2)
async function findAndRenameSymbol(
  filePath: string,
  symbolName: string,
  newName: string,
): Promise<{ found: boolean; renamed: boolean; symbolCount?: number }> {
  try {
    // Convert file path to URI
    const uri = vscode.Uri.file(filePath);

    // Get all symbols in document
    const symbols = await vscode.commands.executeCommand<
      vscode.DocumentSymbol[]
    >("vscode.executeDocumentSymbolProvider", uri);

    if (!symbols || symbols.length === 0) {
      return { found: false, renamed: false };
    }

    // Find the target symbol
    const targetSymbol = findSymbolByName(symbols, symbolName);
    if (!targetSymbol) {
      return { found: false, renamed: false, symbolCount: symbols.length };
    }

    // Use the symbol's range start position for rename
    const position = targetSymbol.range.start;
    const renamed = await renameSymbol(uri, position, newName);

    return { found: true, renamed, symbolCount: symbols.length };
  } catch (error) {
    console.error("Error in findAndRenameSymbol:", error);
    throw error;
  }
}

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
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/quantumSplit" && req.method === "POST") {
      console.log("HTTP trigger received for quantumSplit");
      vscode.commands.executeCommand("cosmic-zebra-refactor.quantumSplit");
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, message: "Command executed" }));
    } else if (req.url === "/rename" && req.method === "POST") {
      console.log("HTTP trigger received for rename");

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { filePath, oldName, newName } = JSON.parse(body);

          if (!filePath || !oldName || !newName) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error: "Missing required fields: filePath, oldName, newName",
              }),
            );
            return;
          }

          const result = await findAndRenameSymbol(filePath, oldName, newName);
          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: true,
              message: "Symbol renamed",
              result,
            }),
          );
        } catch (error) {
          console.error("Rename error:", error);
          res.writeHead(500);
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
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

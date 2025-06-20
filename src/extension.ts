import * as http from "node:http";
import * as vscode from "vscode";
import { debugVersion } from "./version";

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

// Extract method/function from selected code
async function extractMethod(
  uri: vscode.Uri,
  range: vscode.Range,
  methodName: string,
): Promise<boolean> {
  try {
    // Get code actions for the range
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      uri,
      range,
      vscode.CodeActionKind.RefactorExtract.value,
    );

    // Find extract method action
    const extractAction = codeActions?.find(
      (action) =>
        action.title.toLowerCase().includes("extract") &&
        action.title.toLowerCase().includes("method"),
    );

    if (extractAction) {
      // Execute the extract action
      await vscode.commands.executeCommand(
        "vscode.executeCodeAction",
        extractAction,
      );
      return true;
    }

    // Fallback: manual extraction if no code action available
    const document = await vscode.workspace.openTextDocument(uri);
    const selectedText = document.getText(range);

    if (!selectedText.trim()) {
      return false;
    }

    // Create manual extraction
    const edit = new vscode.WorkspaceEdit();

    // Replace selected code with method call
    edit.replace(uri, range, `${methodName}();`);

    // Add method definition at end of class/file
    const insertPosition = new vscode.Position(document.lineCount, 0);
    const methodDefinition = `\n\nprivate ${methodName}(): void {\n${selectedText}\n}`;
    edit.insert(uri, insertPosition, methodDefinition);

    const success = await vscode.workspace.applyEdit(edit);
    return success;
  } catch (error) {
    console.error("Error in extractMethod:", error);
    return false;
  }
}

// Extract variable from selected expression
async function extractVariable(
  uri: vscode.Uri,
  range: vscode.Range,
  variableName: string,
): Promise<boolean> {
  try {
    console.log(
      `extractVariable: Starting extraction for variable "${variableName}"`,
    );
    console.log(
      `extractVariable: Range - start: ${range.start.line}:${range.start.character}, end: ${range.end.line}:${range.end.character}`,
    );

    // Get code actions for the range
    console.log(`extractVariable: Getting code actions for range`);
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      uri,
      range,
      vscode.CodeActionKind.RefactorExtract.value,
    );

    console.log(
      `extractVariable: Found ${codeActions?.length || 0} code actions`,
    );
    codeActions?.forEach((action, i) => {
      console.log(`extractVariable: Action ${i}: ${action.title}`);
    });

    // Find extract action - look for "Extract to constant in enclosing scope"
    const extractAction = codeActions?.find(
      (action) =>
        action.title.toLowerCase().includes("extract") &&
        action.title.toLowerCase().includes("constant") &&
        action.title.toLowerCase().includes("enclosing"),
    );

    if (extractAction) {
      console.log(
        `extractVariable: Found extract action: ${extractAction.title}`,
      );
      // Execute the extract action
      await vscode.commands.executeCommand(
        "vscode.executeCodeAction",
        extractAction,
      );
      return true;
    }

    console.log(`extractVariable: No extract variable/constant action found`);
    return false;
  } catch (error) {
    console.error("Error in extractVariable:", error);
    return false;
  }
}

// Find text in document and return range (single pattern)
async function findTextInDocument(
  uri: vscode.Uri,
  searchText: string,
): Promise<vscode.Range | null> {
  try {
    console.log(
      `findTextInDocument: Searching for "${searchText}" in ${uri.toString()}`,
    );
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();
    console.log(`findTextInDocument: Document content: "${text}"`);

    const index = text.indexOf(searchText);
    console.log(`findTextInDocument: Index of "${searchText}": ${index}`);
    if (index === -1) {
      console.log(`findTextInDocument: Text "${searchText}" not found`);
      return null;
    }

    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + searchText.length);
    console.log(
      `findTextInDocument: Range found - start: ${startPos.line}:${startPos.character}, end: ${endPos.line}:${endPos.character}`,
    );

    return new vscode.Range(startPos, endPos);
  } catch (error) {
    console.error("Error finding text in document:", error);
    return null;
  }
}

// Simple selection-based extraction
async function extractBySelection(
  filePath: string,
  selection: string,
  extractName: string,
  extractType: "method" | "variable",
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(
      `extractBySelection called with: filePath=${filePath}, selection="${selection}", extractName="${extractName}", extractType="${extractType}"`,
    );

    const uri = vscode.Uri.file(filePath);
    console.log(`Opening document: ${uri.toString()}`);
    await vscode.window.showTextDocument(uri);

    // Find the selection text in the document
    console.log(`Searching for selection text: "${selection}"`);
    const range = await findTextInDocument(uri, selection);
    if (!range) {
      console.log(`Selection "${selection}" not found in document`);
      return {
        success: false,
        message: `Selection "${selection}" not found in file`,
      };
    }

    console.log(
      `Found selection at range: ${range.start.line}:${range.start.character} to ${range.end.line}:${range.end.character}`,
    );

    let success = false;
    if (extractType === "method") {
      console.log(`Attempting to extract method "${extractName}"`);
      success = await extractMethod(uri, range, extractName);
    } else if (extractType === "variable") {
      console.log(`Attempting to extract variable "${extractName}"`);
      success = await extractVariable(uri, range, extractName);
    }

    console.log(`Extraction result: ${success}`);

    // Save after extraction
    await new Promise((resolve) => setTimeout(resolve, 500));
    await vscode.workspace.saveAll(false);

    return {
      success,
      message: success
        ? `Successfully extracted ${extractType} "${extractName}" from selection "${selection}"`
        : `Failed to extract ${extractType} "${extractName}" from selection "${selection}"`,
    };
  } catch (error) {
    console.error("Error in extractBySelection:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
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

    // Open the file to ensure it's loaded and analyzed by language server
    const _document = await vscode.window.showTextDocument(uri);

    // Get all symbols in document
    const symbols = await vscode.commands.executeCommand<
      vscode.DocumentSymbol[]
    >("vscode.executeDocumentSymbolProvider", uri);

    if (!symbols || symbols.length === 0) {
      return { found: false, renamed: false };
    }

    // Debug: Log all symbols found
    console.log(`Found ${symbols.length} symbols in ${filePath}:`);
    symbols.forEach((symbol, index) => {
      console.log(
        `  ${index}: ${symbol.name} (${vscode.SymbolKind[symbol.kind]})`,
      );
    });

    // Find the target symbol
    const targetSymbol = findSymbolByName(symbols, symbolName);
    if (!targetSymbol) {
      console.log(
        `Target symbol "${symbolName}" not found among available symbols`,
      );
      return { found: false, renamed: false, symbolCount: symbols.length };
    }

    // Use the symbol's range start position for rename
    const position = targetSymbol.range.start;
    const renamed = await renameSymbol(uri, position, newName);

    console.log(`Rename result: ${renamed}`);

    // Save the document after rename attempt
    // Small delay to ensure WorkspaceEdit changes are applied
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Force save all documents
    await vscode.workspace.saveAll(false);

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
    } else if (req.url === "/extract" && req.method === "POST") {
      console.log("HTTP trigger received for extract");

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { filePath, extractName, extractType, selection } =
            JSON.parse(body);

          if (!filePath || !extractName || !extractType || !selection) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error:
                  "Missing required fields: filePath, extractName, extractType, selection",
              }),
            );
            return;
          }

          if (extractType !== "method" && extractType !== "variable") {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error: "extractType must be 'method' or 'variable'",
              }),
            );
            return;
          }

          const result = await extractBySelection(
            filePath,
            selection,
            extractName,
            extractType,
          );

          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: result.success,
              message: result.message,
            }),
          );
        } catch (error) {
          console.error("Extract error:", error);
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
        JSON.stringify({
          status: "ok",
          extension: "cosmic-zebra-refactor",
          debugVersion,
        }),
      );
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });

  const port = 3141;
  server.listen(port, "localhost", () => {
    console.log(
      `Cosmic Zebra Refactor HTTP server listening on port ${port} (debug v${debugVersion})`,
    );
    vscode.window.showInformationMessage(
      `Extension HTTP server started on port ${port} (debug v${debugVersion})`,
    );
  });

  context.subscriptions.push(disposable, { dispose: () => server.close() });
}

export function deactivate() {}

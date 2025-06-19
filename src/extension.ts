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
      vscode.CodeActionKind.Refactor,
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
    // Get code actions for the range
    const codeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      uri,
      range,
      vscode.CodeActionKind.Refactor,
    );

    // Find extract variable action
    const extractAction = codeActions?.find(
      (action) =>
        action.title.toLowerCase().includes("extract") &&
        action.title.toLowerCase().includes("variable"),
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

    // Replace selected expression with variable reference
    edit.replace(uri, range, variableName);

    // Add variable declaration before the line
    const line = document.lineAt(range.start.line);
    const insertPosition = new vscode.Position(range.start.line, 0);
    const variableDeclaration = `${line.text.match(/^\s*/)?.[0] || ""}const ${variableName} = ${selectedText};\n`;
    edit.insert(uri, insertPosition, variableDeclaration);

    const success = await vscode.workspace.applyEdit(edit);
    return success;
  } catch (error) {
    console.error("Error in extractVariable:", error);
    return false;
  }
}

// Find range between start and end patterns
async function findRangeByPatterns(
  uri: vscode.Uri,
  startsWith: string,
  endsWith: string,
): Promise<vscode.Range | null> {
  try {
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();

    const startIndex = text.indexOf(startsWith);
    if (startIndex === -1) {
      console.log(`Start pattern "${startsWith}" not found`);
      return null;
    }

    const endIndex = text.indexOf(endsWith, startIndex + startsWith.length);
    if (endIndex === -1) {
      console.log(`End pattern "${endsWith}" not found after start pattern`);
      return null;
    }

    const startPos = document.positionAt(startIndex);
    const endPos = document.positionAt(endIndex + endsWith.length);

    return new vscode.Range(startPos, endPos);
  } catch (error) {
    console.error("Error finding range by patterns:", error);
    return null;
  }
}

// Find text in document and return range (single pattern)
async function findTextInDocument(
  uri: vscode.Uri,
  searchText: string,
): Promise<vscode.Range | null> {
  try {
    const document = await vscode.workspace.openTextDocument(uri);
    const text = document.getText();

    const index = text.indexOf(searchText);
    if (index === -1) {
      return null;
    }

    const startPos = document.positionAt(index);
    const endPos = document.positionAt(index + searchText.length);

    return new vscode.Range(startPos, endPos);
  } catch (error) {
    console.error("Error finding text in document:", error);
    return null;
  }
}

// Extract function/method by name
async function _extractFunctionByName(
  uri: vscode.Uri,
  functionName: string,
  newMethodName: string,
): Promise<boolean> {
  try {
    // Get all symbols in document
    const symbols = await vscode.commands.executeCommand<
      vscode.DocumentSymbol[]
    >("vscode.executeDocumentSymbolProvider", uri);

    if (!symbols) {
      return false;
    }

    // Find the function symbol
    const targetSymbol = findSymbolByName(symbols, functionName);
    if (!targetSymbol || targetSymbol.kind !== vscode.SymbolKind.Function) {
      console.log(`Function "${functionName}" not found`);
      return false;
    }

    // Extract the entire function
    return await extractMethod(uri, targetSymbol.range, newMethodName);
  } catch (error) {
    console.error("Error in extractFunctionByName:", error);
    return false;
  }
}

// Extract code by range patterns
async function extractByRange(
  filePath: string,
  startsWith: string,
  endsWith: string,
  extractName: string,
  extractType: "method" | "variable",
): Promise<{ success: boolean; message: string }> {
  try {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);

    // Find the range using start/end patterns
    const range = await findRangeByPatterns(uri, startsWith, endsWith);
    if (!range) {
      return {
        success: false,
        message: `Range not found: "${startsWith}" to "${endsWith}"`,
      };
    }

    console.log(`Found range from "${startsWith}" to "${endsWith}"`);

    let success = false;
    if (extractType === "method") {
      success = await extractMethod(uri, range, extractName);
    } else if (extractType === "variable") {
      success = await extractVariable(uri, range, extractName);
    }

    // Save after extraction
    await new Promise((resolve) => setTimeout(resolve, 500));
    await vscode.workspace.saveAll(false);

    return {
      success,
      message: success
        ? `Successfully extracted ${extractType} "${extractName}" from range`
        : `Failed to extract ${extractType} "${extractName}" from range`,
    };
  } catch (error) {
    console.error("Error in extractByRange:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// Smart text-based extraction (single pattern)
async function _extractByText(
  filePath: string,
  searchText: string,
  extractName: string,
  extractType: "method" | "variable",
): Promise<{ success: boolean; message: string }> {
  try {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);

    // Find the text in the document
    const range = await findTextInDocument(uri, searchText);
    if (!range) {
      return {
        success: false,
        message: `Text "${searchText}" not found in file`,
      };
    }

    // For method extraction, try to expand to include full statements/blocks
    let extractRange = range;
    if (extractType === "method") {
      const document = await vscode.workspace.openTextDocument(uri);

      // Expand to include full lines and braces if needed
      const startLine = range.start.line;
      const endLine = range.end.line;

      // Look for opening/closing braces to capture complete blocks
      const _text = document.getText();
      const _startOffset = document.offsetAt(range.start);
      const _endOffset = document.offsetAt(range.end);

      // Simple heuristic: extend to line boundaries
      const _startLineText = document.lineAt(startLine).text;
      const endLineText = document.lineAt(endLine).text;

      extractRange = new vscode.Range(
        new vscode.Position(startLine, 0),
        new vscode.Position(endLine, endLineText.length),
      );
    }

    let success = false;
    if (extractType === "method") {
      success = await extractMethod(uri, extractRange, extractName);
    } else if (extractType === "variable") {
      success = await extractVariable(uri, extractRange, extractName);
    }

    // Save after extraction
    await new Promise((resolve) => setTimeout(resolve, 500));
    await vscode.workspace.saveAll(false);

    return {
      success,
      message: success
        ? `Successfully extracted ${extractType} "${extractName}" from "${searchText}"`
        : `Failed to extract ${extractType} "${extractName}" from "${searchText}"`,
    };
  } catch (error) {
    console.error("Error in extractByText:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// Main extract function that handles both method and variable extraction
async function performExtraction(
  filePath: string,
  startLine: number,
  startChar: number,
  endLine: number,
  endChar: number,
  extractName: string,
  extractType: "method" | "variable",
): Promise<{ success: boolean; message: string }> {
  try {
    // Convert file path to URI
    const uri = vscode.Uri.file(filePath);

    // Open the file to ensure it's loaded
    await vscode.window.showTextDocument(uri);

    // Create range from coordinates
    const range = new vscode.Range(
      new vscode.Position(startLine, startChar),
      new vscode.Position(endLine, endChar),
    );

    let success = false;
    if (extractType === "method") {
      success = await extractMethod(uri, range, extractName);
    } else if (extractType === "variable") {
      success = await extractVariable(uri, range, extractName);
    }

    // Save after extraction
    await new Promise((resolve) => setTimeout(resolve, 500));
    await vscode.workspace.saveAll(false);

    return {
      success,
      message: success
        ? `Successfully extracted ${extractType} "${extractName}"`
        : `Failed to extract ${extractType} "${extractName}"`,
    };
  } catch (error) {
    console.error("Error in performExtraction:", error);
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
          const {
            filePath,
            extractName,
            extractType,
            startsWith,
            endsWith,
            // Legacy coordinate-based extraction
            startLine,
            startChar,
            endLine,
            endChar,
          } = JSON.parse(body);

          if (!filePath || !extractName || !extractType) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error:
                  "Missing required fields: filePath, extractName, extractType",
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

          let result: { success: boolean; message: string };

          // Use range-based extraction if start/end patterns provided
          if (startsWith && endsWith) {
            result = await extractByRange(
              filePath,
              startsWith,
              endsWith,
              extractName,
              extractType,
            );
          }
          // Fallback to coordinate-based extraction
          else if (
            startLine !== undefined &&
            startChar !== undefined &&
            endLine !== undefined &&
            endChar !== undefined
          ) {
            result = await performExtraction(
              filePath,
              startLine,
              startChar,
              endLine,
              endChar,
              extractName,
              extractType,
            );
          } else {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error:
                  "Must provide either (startsWith, endsWith) or (startLine, startChar, endLine, endChar)",
              }),
            );
            return;
          }

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

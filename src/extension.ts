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
      console.log(`extractVariable: Action ${i} command:`, action.command);
      console.log(`extractVariable: Action ${i} edit:`, action.edit);
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

      // If the action has an edit, apply it directly
      if (extractAction.edit) {
        console.log(`extractVariable: Applying WorkspaceEdit`);
        const success = await vscode.workspace.applyEdit(extractAction.edit);
        console.log(`extractVariable: WorkspaceEdit applied: ${success}`);
        return success;
      }

      // If no edit but has command, try to resolve the action first
      if (extractAction.command) {
        console.log(`extractVariable: Resolving CodeAction to get edit`);

        // Try to resolve the CodeAction to get the actual edit
        const resolvedActions = await vscode.commands.executeCommand<
          vscode.CodeAction[]
        >(
          "vscode.executeCodeActionProvider",
          uri,
          range,
          vscode.CodeActionKind.RefactorExtract.value,
          1, // itemResolveCount - resolve the first action
        );

        const resolvedAction = resolvedActions?.find(
          (action) => action.title === extractAction.title,
        );

        if (resolvedAction?.edit) {
          console.log(`extractVariable: Found resolved edit, applying`);
          const success = await vscode.workspace.applyEdit(resolvedAction.edit);
          console.log(
            `extractVariable: Resolved WorkspaceEdit applied: ${success}`,
          );
          return success;
        }

        console.log(
          `extractVariable: No edit found even after resolving, executing command as fallback`,
        );
        console.log(
          `extractVariable: Executing command: ${extractAction.command.command}`,
        );
        await vscode.commands.executeCommand(
          extractAction.command.command,
          ...(extractAction.command.arguments || []),
        );
        return true;
      } else {
        console.log(
          `extractVariable: Action has no command or edit to execute`,
        );
        return false;
      }
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

// Get available code actions for a text selection
async function getAvailableActions(
  filePath: string,
  selection: string,
): Promise<{
  success: boolean;
  actions: Array<{
    index: number;
    title: string;
    kind: string;
    isPreferred: boolean;
    hasEdit: boolean;
    hasCommand: boolean;
    command: string | null;
  }>;
  message: string;
}> {
  try {
    console.log(
      `getAvailableActions called with: filePath=${filePath}, selection="${selection}"`,
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
        actions: [],
        message: `Selection "${selection}" not found in file`,
      };
    }

    console.log(
      `Found selection at range: ${range.start.line}:${range.start.character} to ${range.end.line}:${range.end.character}`,
    );

    // Get all available code actions for the range
    console.log(`Getting all code actions for range`);
    const allCodeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >("vscode.executeCodeActionProvider", uri, range);

    console.log(`Found ${allCodeActions?.length || 0} total code actions`);

    // Also get refactor-specific actions
    const refactorActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >(
      "vscode.executeCodeActionProvider",
      uri,
      range,
      vscode.CodeActionKind.Refactor.value,
    );

    console.log(`Found ${refactorActions?.length || 0} refactor actions`);

    // Combine and deduplicate actions
    const combinedActions = [...(allCodeActions || [])];
    if (refactorActions) {
      for (const refactorAction of refactorActions) {
        if (
          !combinedActions.some(
            (action) => action.title === refactorAction.title,
          )
        ) {
          combinedActions.push(refactorAction);
        }
      }
    }

    // Format actions for display
    const formattedActions = combinedActions.map((action, index) => ({
      index,
      title: action.title,
      kind: action.kind?.value || "unknown",
      isPreferred: action.isPreferred || false,
      hasEdit: !!action.edit,
      hasCommand: !!action.command,
      command: action.command?.command || null,
    }));

    console.log(`Returning ${formattedActions.length} formatted actions`);

    return {
      success: true,
      actions: formattedActions,
      message: `Found ${formattedActions.length} available actions for selection "${selection}"`,
    };
  } catch (error) {
    console.error("Error in getAvailableActions:", error);
    return {
      success: false,
      actions: [],
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// Perform a specific code action by kind
async function performAction(
  filePath: string,
  selection: string,
  actionKind: string,
): Promise<{ success: boolean; message: string; actionFound: boolean }> {
  try {
    console.log(
      `performAction called with: filePath=${filePath}, selection="${selection}", actionKind="${actionKind}"`,
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
        actionFound: false,
      };
    }

    console.log(
      `Found selection at range: ${range.start.line}:${range.start.character} to ${range.end.line}:${range.end.character}`,
    );

    // Get all available code actions for the range
    console.log(`Getting code actions for range`);
    const allCodeActions = await vscode.commands.executeCommand<
      vscode.CodeAction[]
    >("vscode.executeCodeActionProvider", uri, range);

    console.log(`Found ${allCodeActions?.length || 0} total code actions`);

    // Find the action with matching kind
    const targetAction = allCodeActions?.find(
      (action) => action.kind?.value === actionKind,
    );

    if (!targetAction) {
      console.log(`Action with kind "${actionKind}" not found`);
      const availableKinds =
        allCodeActions?.map((action) => action.kind?.value).filter(Boolean) ||
        [];
      return {
        success: false,
        message: `Action with kind "${actionKind}" not found. Available kinds: ${availableKinds.join(", ")}`,
        actionFound: false,
      };
    }

    console.log(`Found target action: ${targetAction.title}`);

    // Execute the action
    if (targetAction.edit) {
      console.log(`Applying WorkspaceEdit directly`);
      const success = await vscode.workspace.applyEdit(targetAction.edit);
      console.log(`WorkspaceEdit applied: ${success}`);

      if (success) {
        // Save after successful edit
        await new Promise((resolve) => setTimeout(resolve, 500));
        await vscode.workspace.saveAll(false);
      }

      return {
        success,
        message: success
          ? `Successfully executed action "${targetAction.title}"`
          : `Failed to apply edit for action "${targetAction.title}"`,
        actionFound: true,
      };
    } else if (targetAction.command) {
      console.log(
        `Action has command but no direct edit, trying to resolve first`,
      );

      // Try to resolve the CodeAction to get the actual edit (like extractVariable does)
      const resolvedActions = await vscode.commands.executeCommand<
        vscode.CodeAction[]
      >(
        "vscode.executeCodeActionProvider",
        uri,
        range,
        vscode.CodeActionKind.RefactorExtract.value,
        1, // itemResolveCount - resolve the first action
      );

      const resolvedAction = resolvedActions?.find(
        (action) => action.kind?.value === actionKind,
      );

      if (resolvedAction?.edit) {
        console.log(`Found resolved edit, applying WorkspaceEdit`);
        const success = await vscode.workspace.applyEdit(resolvedAction.edit);
        console.log(`Resolved WorkspaceEdit applied: ${success}`);

        if (success) {
          // Save after successful edit
          await new Promise((resolve) => setTimeout(resolve, 500));
          await vscode.workspace.saveAll(false);
        }

        return {
          success,
          message: success
            ? `Successfully executed action "${targetAction.title}"`
            : `Failed to apply resolved edit for action "${targetAction.title}"`,
          actionFound: true,
        };
      }

      console.log(
        `No resolved edit found, executing command as fallback: ${targetAction.command.command}`,
      );
      await vscode.commands.executeCommand(
        targetAction.command.command,
        ...(targetAction.command.arguments || []),
      );

      // Save after command execution
      await new Promise((resolve) => setTimeout(resolve, 500));
      await vscode.workspace.saveAll(false);

      return {
        success: true,
        message: `Successfully executed action "${targetAction.title}"`,
        actionFound: true,
      };
    } else {
      console.log(`Action has no edit or command to execute`);
      return {
        success: false,
        message: `Action "${targetAction.title}" has no executable edit or command`,
        actionFound: true,
      };
    }
  } catch (error) {
    console.error("Error in performAction:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      actionFound: false,
    };
  }
}

// Simple selection-based extraction
async function extractBySelection(
  filePath: string,
  selection: string,
  extractType: "method" | "variable",
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(
      `extractBySelection called with: filePath=${filePath}, selection="${selection}", extractType="${extractType}"`,
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
      console.log(`Attempting to extract method`);
      success = await extractMethod(uri, range, "extractedMethod");
    } else if (extractType === "variable") {
      console.log(`Attempting to extract variable`);
      success = await extractVariable(uri, range, "extractedVariable");
    }

    console.log(`Extraction result: ${success}`);

    // Save after extraction
    await new Promise((resolve) => setTimeout(resolve, 500));
    await vscode.workspace.saveAll(false);

    return {
      success,
      message: success
        ? `Successfully extracted ${extractType} from selection "${selection}"`
        : `Failed to extract ${extractType} from selection "${selection}"`,
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
    await vscode.window.showTextDocument(uri);

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



  // HTTP server for CLI triggers
  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/rename" && req.method === "POST") {
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
          const { filePath, extractType, selection } = JSON.parse(body);

          if (!filePath || !extractType || !selection) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error:
                  "Missing required fields: filePath, extractType, selection",
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
    } else if (req.url === "/actions" && req.method === "POST") {
      console.log("HTTP trigger received for actions");

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { filePath, selection } = JSON.parse(body);

          if (!filePath || !selection) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error: "Missing required fields: filePath, selection",
              }),
            );
            return;
          }

          const result = await getAvailableActions(filePath, selection);

          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: result.success,
              message: result.message,
              actions: result.actions,
            }),
          );
        } catch (error) {
          console.error("Actions error:", error);
          res.writeHead(500);
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          );
        }
      });
    } else if (req.url === "/perform-action" && req.method === "POST") {
      console.log("HTTP trigger received for perform-action");

      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const { filePath, selection, actionKind } = JSON.parse(body);

          if (!filePath || !selection || !actionKind) {
            res.writeHead(400);
            res.end(
              JSON.stringify({
                error:
                  "Missing required fields: filePath, selection, actionKind",
              }),
            );
            return;
          }

          const result = await performAction(filePath, selection, actionKind);

          res.writeHead(200);
          res.end(
            JSON.stringify({
              success: result.success,
              message: result.message,
              actionFound: result.actionFound,
            }),
          );
        } catch (error) {
          console.error("Perform action error:", error);
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

  context.subscriptions.push({ dispose: () => server.close() });
}

export function deactivate() {}

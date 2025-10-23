#!/usr/bin/env bun
import { resolve } from "node:path";
import minimist from "minimist";
import { debugVersion } from "./version.js";

interface RenamePayload {
  filePath: string;
  oldName: string;
  newName: string;
}

interface ExtractPayload {
  filePath: string;
  extractType: "method" | "variable";
  selection: string;
  startLine?: number;
}

interface ActionsPayload {
  filePath: string;
  selection: string;
  startLine?: number;
}

interface SelectPayload {
  filePath: string;
  selection: string;
  startLine?: number;
}

interface PerformActionPayload {
  filePath: string;
  selection: string;
  actionKind: string;
  actionTitle?: string;
  startLine?: number;
}

// Parse command line arguments using minimist
const args = minimist(Bun.argv.slice(2), {
  string: ["port", "host", "command", "selection", "kind", "title", "start-line"],
  boolean: ["help"],
  alias: {
    h: "help",
    p: "port",
    c: "command",
    s: "selection",
    k: "kind",
    t: "title",
    l: "start-line",
  },
  default: {
    port: "3141",
    host: "localhost",
    command: "health",
  },
});

const { help, port, host, command } = args;
const positionals = args._;

// Check for stdin input
let stdinInput = "";
const hasStdin = !process.stdin.isTTY;

function showHelp() {
  console.log(`
Cosmic Zebra Refactor CLI

Usage: bun run cli [options] [command] [args...]

Options:
  -h, --help              Show this help message
  -p, --port <port>       Extension HTTP server port (default: 3141)
  --host <host>           Extension HTTP server host (default: localhost)
  -c, --command <cmd>     Command to execute (default: quantumSplit)
  -s, --selection <text>  Text selection for refactoring commands
  -k, --kind <kind>       Action kind for perform-action command
  -t, --title <title>     Action title for perform-action command (optional)
  -l, --start-line <num>  Start searching from this line number (1-based)

Commands:
  health                Check extension health status
  check-version [expected]  Check extension version
  rename <file> <old> <new>    Rename symbol in file
  select <file> --selection <text> [--start-line <num>]    Test selection mechanism (shows what will be selected)
  extract <file> <type> --selection <text> [--start-line <num>]    Extract method or variable
  actions [file] [--selection <text>] [--start-line <num>]  Get available code actions (uses stdin as selection if no file)
  perform-action <file> --selection <text> --kind <kind> [--title <title>] [--start-line <num>]    Execute specific action by kind and optionally title

Examples:
  bun run cli                           # Execute health command (default)
  bun run cli health                    # Check health status
  bun run cli check-version             # Check extension version
  bun run cli -p 3142 health            # Use custom port
  bun run cli --command health          # Execute health command
  bun run cli rename src/app.ts oldName newName  # Rename symbol in file
  bun run cli select test.js --selection "total"  # Test what gets selected for "total"
  bun run cli select test.js --selection "total" --start-line 19  # Test selection from line 19
  bun run cli extract ultra-simple.js variable --selection "0"  # Extract "0" to variable
  bun run cli actions ultra-simple.js --selection "0"  # Get available actions for "0"
  bun run cli actions ultra-simple.js --selection "total" --start-line 19  # Get actions for "total" starting from line 19
  echo "const x = 1;" | bun run cli actions ultra-simple.js  # Use piped text as selection
  bun run cli perform-action ultra-simple.js --selection "0" --kind "refactor.extract.constant"  # Extract "0" to constant
  bun run cli perform-action ultra-simple.js --selection "total" --kind "refactor.inline.variable" --start-line 21  # Inline "total" at line 21
  echo "0" | bun run cli perform-action ultra-simple.js --kind "refactor.extract.constant"  # Extract "0" to constant using stdin
`);
}

async function callExtension(
  host: string,
  port: string,
  command: string,
  payload?:
    | RenamePayload
    | ExtractPayload
    | ActionsPayload
    | PerformActionPayload,
) {
  const url = `http://${host}:${port}/${command}`;
  const method = command === "health" ? "GET" : "POST";

  try {
    console.log(`Calling ${method} ${url}`);
    if (payload) {
      console.log("Payload:", JSON.stringify(payload, null, 2));
    }

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Response:", JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error("Error calling extension:", error);
    process.exit(1);
  }
}

// Helper function to resolve file path to absolute path
function resolveFilePath(filePath: string): string {
  return resolve(process.cwd(), filePath);
}

async function main() {
  // Handle stdin reading at the start
  if (hasStdin) {
    stdinInput = await Bun.stdin.text();
    stdinInput = stdinInput.trim();
  }
  if (help) {
    showHelp();
    return;
  }

  const cmd = positionals[0] || command;

  if (cmd === "rename") {
    const [, filePath, oldName, newName] = positionals;

    if (!filePath || !oldName || !newName) {
      console.error(
        "Error: rename command requires <file> <old> <new> arguments",
      );
      console.log("Usage: bun run cli rename <file> <old> <new>");
      process.exit(1);
    }

    const payload: RenamePayload = {
      filePath: resolveFilePath(filePath),
      oldName,
      newName,
    };

    await callExtension(host, port, "rename", payload);
  } else if (cmd === "extract") {
    const [, filePath, extractType] = positionals;
    const selection = args.selection;

    if (!filePath || !extractType) {
      console.error("Error: extract command requires <file> <type> arguments");
      console.log(
        "Usage: bun run cli extract <file> <type> --selection <text>",
      );
      console.log("Type must be 'method' or 'variable'");
      process.exit(1);
    }

    if (extractType !== "method" && extractType !== "variable") {
      console.error("Error: extractType must be 'method' or 'variable'");
      process.exit(1);
    }

    if (!selection) {
      console.error("Error: --selection <text> is required");
      console.log(
        "Usage: bun run cli extract <file> <type> --selection <text>",
      );
      process.exit(1);
    }

    const payload: ExtractPayload = {
      filePath: resolveFilePath(filePath),
      extractType: extractType as "method" | "variable",
      selection,
    };

    await callExtension(host, port, "extract", payload);
  } else if (cmd === "actions") {
    const [, filePath] = positionals;
    let selection = args.selection;

    if (hasStdin && stdinInput) {
      // Handle stdin input case - the piped text IS the selection
      if (!filePath) {
        console.error(
          "Error: file argument required when using stdin as selection",
        );
        console.log("Usage: echo 'selection' | bun run cli actions <file>");
        process.exit(1);
      }
      selection = stdinInput;
    }

    if (!filePath) {
      console.error(
        "Error: actions command requires <file> argument or stdin input",
      );
      console.log("Usage: bun run cli actions <file> --selection <text>");
      console.log("   or: echo 'selection' | bun run cli actions");
      process.exit(1);
    }

    if (!selection) {
      console.error("Error: --selection <text> is required");
      console.log("Usage: bun run cli actions <file> --selection <text>");
      process.exit(1);
    }

    const payload: ActionsPayload = {
      filePath: resolveFilePath(filePath),
      selection,
    };

    if (args["start-line"]) {
      payload.startLine = Number.parseInt(args["start-line"], 10);
    }

    await callExtension(host, port, "actions", payload);
  } else if (cmd === "select") {
    const [, filePath] = positionals;
    let selection = args.selection;

    if (hasStdin && stdinInput) {
      if (!filePath) {
        console.error(
          "Error: file argument required when using stdin as selection",
        );
        console.log("Usage: echo 'selection' | bun run cli select <file>");
        process.exit(1);
      }
      selection = stdinInput;
    }

    if (!filePath) {
      console.error("Error: select command requires <file> argument");
      console.log("Usage: bun run cli select <file> --selection <text>");
      process.exit(1);
    }

    if (!selection) {
      console.error("Error: --selection <text> is required");
      console.log("Usage: bun run cli select <file> --selection <text>");
      process.exit(1);
    }

    const payload: SelectPayload = {
      filePath: resolveFilePath(filePath),
      selection,
    };

    if (args["start-line"]) {
      payload.startLine = Number.parseInt(args["start-line"], 10);
    }

    await callExtension(host, port, "select", payload);
  } else if (cmd === "perform-action") {
    const [, filePath] = positionals;
    let selection = args.selection;
    const actionKind = args.kind;
    const actionTitle = args.title;

    if (hasStdin && stdinInput) {
      // Handle stdin input case - the piped text IS the selection
      if (!filePath) {
        console.error(
          "Error: file argument required when using stdin as selection",
        );
        console.log(
          "Usage: echo 'selection' | bun run cli perform-action <file> --kind <kind>",
        );
        process.exit(1);
      }
      selection = stdinInput;
    }

    if (!filePath) {
      console.error("Error: perform-action command requires <file> argument");
      console.log(
        "Usage: bun run cli perform-action <file> --selection <text> --kind <kind>",
      );
      process.exit(1);
    }

    if (!selection) {
      console.error("Error: --selection <text> is required");
      console.log(
        "Usage: bun run cli perform-action <file> --selection <text> --kind <kind>",
      );
      process.exit(1);
    }

    if (!actionKind) {
      console.error("Error: --kind <kind> is required");
      console.log(
        "Usage: bun run cli perform-action <file> --selection <text> --kind <kind>",
      );
      console.log(
        "Example kinds: refactor.extract.constant, refactor.extract.function, refactor.surround",
      );
      process.exit(1);
    }

    const payload: PerformActionPayload = {
      filePath: resolveFilePath(filePath),
      selection,
      actionKind,
      ...(actionTitle && { actionTitle }),
    };

    if (args["start-line"]) {
      payload.startLine = Number.parseInt(args["start-line"], 10);
    }

    await callExtension(host, port, "perform-action", payload);
  } else if (cmd === "check-version") {
    const expectedVersion = positionals[1] ? parseInt(positionals[1]) : debugVersion;
    const result = (await callExtension(host, port, "health")) as {
      debugVersion: number;
    };
    console.log(`Extension version: ${result.debugVersion}`);
    console.log(`Expected version: ${expectedVersion}`);
    console.log(
      `Match: ${result.debugVersion === expectedVersion ? "✅" : "❌"}`,
    );
  } else {
    await callExtension(host, port, cmd);
  }
}

main().catch(console.error);

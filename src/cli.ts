#!/usr/bin/env bun
import minimist from "minimist";

interface RenamePayload {
  filePath: string;
  oldName: string;
  newName: string;
}

interface ExtractPayload {
  filePath: string;
  extractType: "method" | "variable";
  selection: string;
}

interface ActionsPayload {
  filePath: string;
  selection: string;
}

// Parse command line arguments using minimist
const args = minimist(Bun.argv.slice(2), {
  string: ["port", "host", "command", "selection"],
  boolean: ["help"],
  alias: {
    h: "help",
    p: "port",
    c: "command",
    s: "selection",
  },
  default: {
    port: "3141",
    host: "localhost",
    command: "quantumSplit",
  },
});

const { help, port, host, command } = args;
const positionals = args._;

function showHelp() {
  console.log(`
Cosmic Zebra Refactor CLI

Usage: bun run cli [options] [command] [args...]

Options:
  -h, --help              Show this help message
  -p, --port <port>       Extension HTTP server port (default: 3141)
  --host <host>           Extension HTTP server host (default: localhost)
  -c, --command <cmd>     Command to execute (default: quantumSplit)

Commands:
  quantumSplit           Trigger quantum split analysis
  health                Check extension health status
  check-version [expected]  Check extension version
  rename <file> <old> <new>    Rename symbol in file
  extract <file> <type> --selection <text>    Extract method or variable
  actions <file> --selection <text>    Get available code actions for selection

Examples:
  bun run cli                           # Execute quantumSplit command
  bun run cli health                    # Check health status
  bun run cli check-version             # Check extension version
  bun run cli -p 3142 quantumSplit      # Use custom port
  bun run cli --command health          # Execute health command
  bun run cli rename src/app.ts oldName newName  # Rename symbol in file
  bun run cli extract ultra-simple.js variable --selection "0"  # Extract "0" to variable
  bun run cli actions ultra-simple.js --selection "0"  # Get available actions for "0"
`);
}

async function callExtension(
  host: string,
  port: string,
  command: string,
  payload?: RenamePayload | ExtractPayload | ActionsPayload,
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

async function main() {
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
      filePath,
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
      filePath,
      extractType: extractType as "method" | "variable",
      selection,
    };

    await callExtension(host, port, "extract", payload);
  } else if (cmd === "actions") {
    const [, filePath] = positionals;
    const selection = args.selection;

    if (!filePath) {
      console.error("Error: actions command requires <file> argument");
      console.log("Usage: bun run cli actions <file> --selection <text>");
      process.exit(1);
    }

    if (!selection) {
      console.error("Error: --selection <text> is required");
      console.log("Usage: bun run cli actions <file> --selection <text>");
      process.exit(1);
    }

    const payload: ActionsPayload = {
      filePath,
      selection,
    };

    await callExtension(host, port, "actions", payload);
  } else if (cmd === "check-version") {
    const expectedVersion = positionals[1] ? parseInt(positionals[1]) : 6;
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

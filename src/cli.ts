#!/usr/bin/env bun
import minimist from "minimist";

// Parse command line arguments using minimist
const args = minimist(Bun.argv.slice(2), {
	string: ["port", "host", "command"],
	boolean: ["help"],
	alias: {
		h: "help",
		p: "port",
		c: "command",
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

Usage: bun run cli [options] [command]

Options:
  -h, --help              Show this help message
  -p, --port <port>       Extension HTTP server port (default: 3141)
  --host <host>           Extension HTTP server host (default: localhost)
  -c, --command <cmd>     Command to execute (default: quantumSplit)

Commands:
  quantumSplit           Trigger quantum split analysis
  health                Check extension health status

Examples:
  bun run cli                           # Execute quantumSplit command
  bun run cli health                    # Check health status
  bun run cli -p 3142 quantumSplit      # Use custom port
  bun run cli --command health          # Execute health command
`);
}

async function callExtension(host: string, port: string, command: string) {
	const url = `http://${host}:${port}/${command}`;
	const method = command === "health" ? "GET" : "POST";

	try {
		console.log(`Calling ${method} ${url}`);

		const response = await fetch(url, {
			method,
			headers: {
				"Content-Type": "application/json",
			},
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

	await callExtension(host, port, cmd);
}

main().catch(console.error);

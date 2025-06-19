#!/usr/bin/env bun

// Parse command line arguments using Bun.argv
const args = Bun.argv.slice(2);

interface CliOptions {
	help: boolean;
	port: string;
	host: string;
	command: string;
}

function parseCliArgs(args: string[]): { options: CliOptions; positionals: string[] } {
	const options: CliOptions = {
		help: false,
		port: "3141",
		host: "localhost", 
		command: "quantumSplit",
	};
	const positionals: string[] = [];

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		
		if (arg === "-h" || arg === "--help") {
			options.help = true;
		} else if (arg === "-p" || arg === "--port") {
			options.port = args[++i] || options.port;
		} else if (arg === "--host") {
			options.host = args[++i] || options.host;
		} else if (arg === "-c" || arg === "--command") {
			options.command = args[++i] || options.command;
		} else if (!arg.startsWith("-")) {
			positionals.push(arg);
		}
	}

	return { options, positionals };
}

const { options, positionals } = parseCliArgs(args);

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
	if (options.help) {
		showHelp();
		return;
	}

	const command = positionals[0] || options.command;
	const host = options.host;
	const port = options.port;

	await callExtension(host, port, command);
}

main().catch(console.error);
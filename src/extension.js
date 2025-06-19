var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __moduleCache = /* @__PURE__ */ new WeakMap;
var __toCommonJS = (from) => {
  var entry = __moduleCache.get(from), desc;
  if (entry)
    return entry;
  entry = __defProp({}, "__esModule", { value: true });
  if (from && typeof from === "object" || typeof from === "function")
    __getOwnPropNames(from).map((key) => !__hasOwnProp.call(entry, key) && __defProp(entry, key, {
      get: () => from[key],
      enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
    }));
  __moduleCache.set(from, entry);
  return entry;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};

// src/extension.ts
var exports_extension = {};
__export(exports_extension, {
  deactivate: () => deactivate,
  activate: () => activate
});
module.exports = __toCommonJS(exports_extension);
var vscode = __toESM(require("vscode"));
var http = __toESM(require("http"));
function activate(context) {
  console.log("Cosmic Zebra Refactor extension activated!");
  const disposable = vscode.commands.registerCommand("cosmic-zebra-refactor.quantumSplit", () => {
    console.log("quantumSplit command executed!");
    vscode.window.showInformationMessage("Quantum Split Analysis activated! \uD83E\uDD93⚡");
  });
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
      res.end(JSON.stringify({ status: "ok", extension: "cosmic-zebra-refactor" }));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: "Not found" }));
    }
  });
  const port = 3141;
  server.listen(port, "localhost", () => {
    console.log(`Cosmic Zebra Refactor HTTP server listening on port ${port}`);
    vscode.window.showInformationMessage(`Extension HTTP server started on port ${port}`);
  });
  context.subscriptions.push(disposable, { dispose: () => server.close() });
}
function deactivate() {}

//# debugId=EE318A9F49AD84E564756E2164756E21
//# sourceMappingURL=extension.js.map

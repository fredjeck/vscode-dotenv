import { fstat } from "fs";
import { env } from "process";
import stream = require("stream");
import readline = require("readline");
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "dotenv" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("dotenv.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from dotenv!");
    console.log(process.env);
    //process.env.TOTO_TITI="proutiprouta";
    const collection = context.environmentVariableCollection;
    collection.replace("PROUTIRPOUTA", "BA");
    collection.append("PROUTIRPOUTA", "BAR");
    collection.append("TOTO_TITI", "POUETTE");
  });
  context.subscriptions.push(disposable);

  disposable = vscode.commands.registerCommand(
    "dotenv.activate.env",
    async () => {
      let envs = await listEnvironments();
      let selection = await vscode.window.showQuickPick(
        envs.map((e) => e.fullName())
      );
      let selected = envs.find((x) => x.fullName() === selection);
      if (selected) {

        let map = await parseEnvFile(await loadEnvironmentFile(selected.location));

        const collection = context.environmentVariableCollection;
        for(let key in map){
          collection.replace(key, map[key]);
          process.env[key] = map[key];
        }

        let sti = vscode.window.createStatusBarItem(
          "stEnv",
          vscode.StatusBarAlignment.Left,
          1
        );
        sti.text = `env:${selected.name}`;
        sti.show();

        vscode.window.showInformationMessage(`env:${selected.fullName()} activated`);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}

export async function listEnvironments(): Promise<Environment[]> {
  let workspaces: vscode.WorkspaceFolder[] = [];
  vscode.workspace.workspaceFolders?.forEach((w) => workspaces.push(w));
  return workspaces.length === 0 ? [] : findEnvironments(workspaces);
}

/**
 * Searches for environments files in the provided workspaces.
 * Valid environment files :
 * - .env
 * - production.env
 * -.env.production
 * @param workspaces A list of workspaces to search in
 * @returns All the environments found in the provided workspaces
 */
export async function findEnvironments(
  workspaces: vscode.WorkspaceFolder[]
): Promise<Environment[]> {
  let environments = workspaces.map(async (workspace) => {
    let files = await vscode.workspace.fs.readDirectory(workspace.uri);
    return files
      .filter(
        (f) =>
          f[1] === vscode.FileType.File &&
          (f[0].toLowerCase().startsWith(".env") ||
            f[0].toLowerCase().endsWith(".env"))
      )
      .map(
        (f) =>
          new Environment(
            workspace.name,
            f[0] === ".env" ? "default" : f[0].replace(/\.env\.?/, ""),
            vscode.Uri.joinPath(workspace.uri, f[0])
          )
      );
  });
  return Promise.all(environments).then((e) => e.flat());
}

export async function loadEnvironmentFile(uri: vscode.Uri): Promise<Buffer> {
  let map: EnvironmentMap = {};

  try {
    await vscode.workspace.fs.stat(uri);
  } catch {
    return Buffer.from("");
  }

  return Buffer.from(await vscode.workspace.fs.readFile(uri));
}

export async function parseEnvFile(buffer: Buffer): Promise<EnvironmentMap> {
  let bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);

  let rl = readline.createInterface({
    input: bufferStream,
    crlfDelay: Infinity
  });

  let map:EnvironmentMap = {};
  for await (const line of rl) {
    let split = line.split('=');
    map[split[0]]=split[1].replace(/["'](.*?)["']/g,"$1");
  }

  return map;
}

type EnvironmentMap = {
  [key: string]: string;
};

/**
 * Container for environments
 */
class Environment {
  constructor(
    public workspace: string,
    public name: string,
    public location: vscode.Uri
  ) {}

  public fullName = () => `${this.workspace} - ${this.name}`;
}

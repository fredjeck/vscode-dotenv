import * as assert from 'assert';
import { readdir } from 'fs/promises';
import { join } from 'path';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');
	const assetsPath = join(__dirname, '..','..','..','src','test', 'suite','assets');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Find environments', async () => {
		var folders = await readdir(join(assetsPath,"workspaces"));
		let workspaces = [];
		for (const workspace of folders){
    		workspaces.push({index:0, name:workspace, uri:vscode.Uri.file(join(assetsPath,"workspaces", workspace))} as vscode.WorkspaceFolder);
		}
		let envs = await myExtension.findEnvironments(workspaces);
		assert(envs.length === 3);
		assert(envs.find(e=>e.name==="default"));
		assert(envs.find(e=>e.name==="production"));
		assert(envs.find(e=>e.name==="debug"));
	});

	test('Should parse a simple Environment file structure', async () => {
		let buffer=Buffer.from("A='B'\nC='D'");
		let map = await myExtension.parseEnvFile(buffer);
		assert.strictEqual(map["A"],"B");
		assert.strictEqual(map["C"],"D");
	});
});

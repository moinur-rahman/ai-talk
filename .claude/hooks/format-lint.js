#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const input = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const filePath = input.tool_input?.file_path;

if (!filePath) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR;
const clientDir = path.join(projectDir, 'client');
const serverDir = path.join(projectDir, 'server');

let workspace = null;
if (filePath.startsWith(clientDir + '/')) {
  workspace = clientDir;
} else if (filePath.startsWith(serverDir + '/')) {
  workspace = serverDir;
} else {
  process.exit(0);
}

const prettierBin = path.join(workspace, 'node_modules/.bin/prettier');
const eslintBin = path.join(workspace, 'node_modules/.bin/eslint');

// Auto-fix formatting — never blocks Claude
spawnSync(prettierBin, ['--write', filePath], { stdio: 'pipe' });

// Check only — let Claude fix lint errors itself
const result = spawnSync(eslintBin, [filePath], { cwd: workspace, stdio: 'pipe' });
if (result.status !== 0) {
  const output = (result.stdout?.toString() || '') + (result.stderr?.toString() || '');
  process.stderr.write(output);
  process.exit(2);
}

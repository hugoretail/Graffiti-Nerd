#!/usr/bin/env node
/**
 * Copies the built Graffiti Trainer dist folder into a docs/trainer folder at repo root.
 * This is only needed if you prefer using the classic GitHub Pages (from /docs) instead of Actions.
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const source = path.join(repoRoot, 'Graffiti Trainer', 'dist');
const target = path.join(repoRoot, 'docs', 'trainer');

if (!fs.existsSync(source)) {
  console.error('Build output not found at', source);
  process.exit(1);
}

fs.mkdirSync(target, { recursive: true });

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursive(source, target);
console.log('Copied trainer dist to', target);

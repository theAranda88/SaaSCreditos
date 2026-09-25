import fs from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..', 'src');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, acc);
    else if (name.name.endsWith('.component.ts')) {
      const c = fs.readFileSync(p, 'utf8');
      if (/styles:\s*`/.test(c)) acc.push(p);
    }
  }
  return acc;
}

function useTokensPath(tsFile) {
  const relDir = path.relative(path.join(root, 'app'), path.dirname(tsFile));
  const segments = relDir.split(path.sep).filter(Boolean);
  const up = '../'.repeat(segments.length);
  return `@use '${up}nucleo/ui/tokens';\n\n`;
}

for (const tsPath of walk(path.join(root, 'app'))) {
  let content = fs.readFileSync(tsPath, 'utf8');
  const m = content.match(/styles:\s*`([\s\S]*?)`,\s*\n\}\)/);
  if (!m) {
    console.error('sin bloque styles:', tsPath);
    continue;
  }
  const css = m[1].trim();
  const scssPath = tsPath.replace(/\.ts$/, '.scss');
  fs.writeFileSync(scssPath, useTokensPath(tsPath) + css + '\n');
  const styleUrl = './' + path.basename(scssPath);
  content = content.replace(/styles:\s*`[\s\S]*?`,/, `styleUrl: '${styleUrl}',`);
  fs.writeFileSync(tsPath, content);
  console.log('OK', path.relative(root, tsPath));
}

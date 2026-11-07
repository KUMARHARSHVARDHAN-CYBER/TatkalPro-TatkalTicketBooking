const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'node_modules/next/dist/lib/has-necessary-dependencies.js');
if (!fs.existsSync(targetFile)) {
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');
const target = `const pkgPath = await _fs.promises.realpath((0, _resolvefrom.resolveFrom)(baseDir, \`\${p.pkg}/package.json\`));`;
const replacement = `let pkgPath;
            try {
                pkgPath = await _fs.promises.realpath((0, _resolvefrom.resolveFrom)(baseDir, \`\${p.pkg}/package.json\`));
            } catch {
                pkgPath = (0, _resolvefrom.resolveFrom)(baseDir, \`\${p.pkg}/package.json\`);
            }`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('[TatkalPro] Applied Windows EPERM realpath fallback patch to Next.js');
}


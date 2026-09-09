const fs = require('fs');
const path = require('path');
const root = __dirname;
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of fs.readdirSync(path.join(root, 'src'))) {
  fs.cpSync(path.join(root, 'src', file), path.join(out, file), { recursive: true });
}
for (const dir of ['rtl', 'patcher']) {
  fs.mkdirSync(path.join(out, dir), { recursive: true });
  for (const file of fs.readdirSync(path.join(root, 'src', dir))) fs.copyFileSync(path.join(root, 'src', dir, file), path.join(out, dir, file));
}
console.log(`Built ${out}`);

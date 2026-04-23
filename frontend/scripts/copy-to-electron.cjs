const { cpSync } = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../dist');
const destDir = path.join(__dirname, '../../agent/ui');

try {
  cpSync(srcDir, destDir, { recursive: true, force: true });
  console.log(`✓ Frontend build copiado a agent/ui/`);
} catch (err) {
  console.error(`✗ Error al copiar: ${err.message}`);
  process.exit(1);
}

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { app } = require('electron');

// Si POS_ID está en .env, lo usa (preferido para producción).
// De lo contrario, genera y persiste un UUID en %APPDATA%/dps-desk/posId.txt
function getPosId() {
  if (process.env.POS_ID) {
    return process.env.POS_ID;
  }

  const dir = app.getPath('userData');
  const file = path.join(dir, 'posId.txt');
  if (fs.existsSync(file)) {
    return fs.readFileSync(file, 'utf8').trim();
  }
  const id = uuidv4();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, id);
  return id;
}

module.exports = { getPosId };

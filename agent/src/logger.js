const fs = require('fs');
const path = require('path');

let logFile = null;

function initLogger(userDataDir) {
  logFile = path.join(userDataDir, 'agent.log');
  // Rotar log si pasa los 5MB
  try {
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      if (stats.size > 5 * 1024 * 1024) {
        const old = path.join(userDataDir, 'agent.old.log');
        if (fs.existsSync(old)) fs.unlinkSync(old);
        fs.renameSync(logFile, old);
      }
    }
  } catch {}
}

function log(...args) {
  const ts = new Date().toISOString();
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
  const line = `[${ts}] ${msg}`;
  console.log(line);
  if (logFile) {
    try {
      fs.appendFileSync(logFile, line + '\n');
    } catch {}
  }
}

module.exports = { initLogger, log };

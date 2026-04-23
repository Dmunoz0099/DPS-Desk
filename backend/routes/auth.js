const express = require('express');
const { signToken } = require('../middleware/auth');

const router = express.Router();

// Login mock — acepta cualquier usuario/contraseña no vacíos.
// Más adelante se reemplaza por validación real contra BD.
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const token = signToken({ sub: username, role: 'admin' });
  res.json({
    token,
    user: { username, role: 'admin', email: `${username}@dpsdesk.local` },
  });
});

router.get('/me', (_req, res) => {
  res.json({ username: 'diego', role: 'admin', email: 'd.munozzapata99@gmail.com' });
});

module.exports = router;

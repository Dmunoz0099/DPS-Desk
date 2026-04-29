const express = require('express');
const { signToken, authRequired } = require('../middleware/auth');

const router = express.Router();

// Login mock — acepta cualquier usuario/contraseña no vacíos.
// Más adelante se reemplaza por validación real contra BD.
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const email = username.includes('@') ? username : `${username}@dpsdesk.local`;
  const token = signToken({ sub: username, role: 'admin', email });
  res.json({
    token,
    user: { username, role: 'admin', email },
  });
});

router.get('/me', authRequired, (req, res) => {
  res.json({
    username: req.user.sub,
    role: req.user.role || 'admin',
    email: req.user.email || `${req.user.sub}@dpsdesk.local`,
  });
});

module.exports = router;

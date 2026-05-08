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

// Google OAuth — verifica un ID token emitido por Google Identity Services.
// Se usa el endpoint público tokeninfo de Google para no agregar deps; Google
// hace la verificación de firma por nosotros.
//
// Si GOOGLE_CLIENT_ID está en env, validamos que el "aud" coincida.
// Si está en GOOGLE_ALLOWED_DOMAIN, validamos el hd (hosted domain de Workspace).
router.post('/google', async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) {
    return res.status(400).json({ error: 'credential requerido' });
  }
  try {
    const r = await fetch(
      'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential)
    );
    if (!r.ok) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }
    const info = await r.json();

    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && info.aud !== expectedAud) {
      return res.status(401).json({ error: 'Audience no coincide con el client ID configurado' });
    }
    const allowedDomain = process.env.GOOGLE_ALLOWED_DOMAIN;
    if (allowedDomain && info.hd !== allowedDomain) {
      return res.status(403).json({ error: `Solo cuentas @${allowedDomain} pueden ingresar` });
    }
    if (!info.email || (info.email_verified !== true && info.email_verified !== 'true')) {
      return res.status(401).json({ error: 'Email no verificado por Google' });
    }

    const token = signToken({
      sub: info.sub,
      role: 'admin',
      email: info.email,
      name: info.name || info.email,
      picture: info.picture || null,
    });
    res.json({
      token,
      user: {
        username: info.email,
        email: info.email,
        name: info.name || info.email,
        picture: info.picture || null,
        role: 'admin',
      },
    });
  } catch (err) {
    console.error('[Auth] Google verify error:', err.message);
    res.status(500).json({ error: 'No se pudo verificar el token de Google' });
  }
});

router.get('/me', authRequired, (req, res) => {
  res.json({
    username: req.user.sub,
    role: req.user.role || 'admin',
    email: req.user.email || `${req.user.sub}@dpsdesk.local`,
    name: req.user.name || req.user.email || req.user.sub,
    picture: req.user.picture || null,
  });
});

module.exports = router;

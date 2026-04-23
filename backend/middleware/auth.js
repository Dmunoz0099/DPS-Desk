const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dpsdesk_dev_secret';

// Middleware JWT mock. En producción se valida contra usuarios reales.
function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '8h' });
}

module.exports = { authRequired, signToken, SECRET };

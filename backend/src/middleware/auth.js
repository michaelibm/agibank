const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'agibank_secret';

const verify = (token) => jwt.verify(token, SECRET);

const getToken = (req) => req.headers.authorization?.split(' ')[1];

// Cliente autenticado (qualquer empresa)
const authMiddleware = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    req.user = verify(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Admin de empresa
const adminMiddleware = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    const decoded = verify(token);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Acesso negado.' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

// Super Admin
const superAdminMiddleware = (req, res, next) => {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });
  try {
    const decoded = verify(token);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Acesso negado.' });
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

const generateToken = (payload, expiresIn = '7d') =>
  jwt.sign(payload, SECRET, { expiresIn });

module.exports = { authMiddleware, adminMiddleware, superAdminMiddleware, generateToken };

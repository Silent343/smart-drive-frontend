/* eslint-disable */
const fs      = require('fs');
const path    = require('path');
const speakeasy = require('speakeasy');
const qrcode    = require('qrcode');

const DB_PATH = path.join(__dirname, 'db.json');

const SIGN_IN_PATHS = new Set([
  '/sign-in', '/api/v1/sign-in',
  '/api/v1/authentication/sign-in', '/authentication/sign-in'
]);
const SIGN_UP_PATHS = new Set([
  '/sign-up', '/api/v1/sign-up',
  '/api/v1/authentication/sign-up', '/authentication/sign-up'
]);
const TOTP_SETUP_PATHS        = new Set(['/api/v1/totp-setup',        '/totp-setup']);
const TOTP_VERIFY_SETUP_PATHS = new Set(['/api/v1/verify-totp-setup', '/verify-totp-setup']);
const TOTP_VERIFY_PATHS       = new Set(['/api/v1/verify-totp',       '/verify-totp']);

function loadDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch (err) {
    console.error('[auth-middleware] Error leyendo db.json:', err.message);
    return { users: [] };
  }
}

function saveDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[auth-middleware] Error guardando en db.json:', err.message);
  }
}

module.exports = (req, res, next) => {
  if (req.method !== 'POST') return next();

  const db    = loadDb();
  const users = db.users || [];

  // 1. SIGN IN
  if (SIGN_IN_PATHS.has(req.path)) {
    const { email, password } = req.body || {};

    if (!email || !password)
      return res.status(400).json({ error: 'Se requiere email y password' });

    const user = users.find(u => u.email === email && u.password === password);

    if (!user)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    if (user.totpEnabled) {
      return res.json({ requiresTotp: true, userId: user.id.toString() });
    }

    return res.json({
      id:       user.id.toString(),
      email:    user.email,
      fullName: user.fullName,
      role:     user.role || 'Operador',
      dni:      user.dni  || 'Sin DNI',
      token:    `fake-jwt-token-smartdrive-${user.id}`
    });
  }

  // 2. SIGN UP
  if (SIGN_UP_PATHS.has(req.path)) {
    const newUser = req.body || {};

    if (!newUser.email || !newUser.password)
      return res.status(400).json({ error: 'Datos incompletos para el registro' });

    const exists = users.some(u => u.email === newUser.email);
    if (exists)
      return res.status(409).json({ error: 'El email ya está registrado' });

    const newId = users.length > 0
      ? Math.max(...users.map(u => Number(u.id))) + 1
      : 1;

    const userToSave = { ...newUser, id: newId };
    db.users.push(userToSave);
    saveDb(db);

    return res.status(201).json({
      id:    userToSave.id.toString(),
      email: userToSave.email
    });
  }

  // 3. TOTP SETUP (genera secreto + QR)
  if (TOTP_SETUP_PATHS.has(req.path)) {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId requerido' });

    const user = users.find(u => u.id.toString() === userId.toString());
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const secret = speakeasy.generateSecret({
      name: `SmartDrive:${user.email}`,
      length: 20
    });

    qrcode.toDataURL(secret.otpauth_url)
      .then(dataUrl => {
        // Guardamos DESPUÉS de enviar la respuesta
        res.json({ qrCode: dataUrl, secret: secret.base32 });

        // Guardamos el secreto con un pequeño delay para evitar el reinicio
        setTimeout(() => {
          user.totpSecretPending = secret.base32;
          saveDb(db);
        }, 100);
      })
      .catch(err => {
        res.status(500).json({ error: 'Error generando QR' });
      });

    return;
  }

  // 4. CONFIRM TOTP SETUP (usuario confirma el escaneo)
  if (TOTP_VERIFY_SETUP_PATHS.has(req.path)) {
    const { userId, token } = req.body || {};
    const user = users.find(u => u.id.toString() === userId?.toString());

    if (!user?.totpSecretPending)
      return res.status(400).json({ error: 'No hay setup pendiente' });

    const valid = speakeasy.totp.verify({
      secret:   user.totpSecretPending,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!valid) return res.status(401).json({ error: 'Código inválido' });

    user.totpSecret = user.totpSecretPending;
    delete user.totpSecretPending;
    user.totpEnabled = true;
    saveDb(db);

    return res.json({ success: true });
  }

  // 5. VERIFY TOTP (login con 2FA activo)
  if (TOTP_VERIFY_PATHS.has(req.path)) {
    const { userId, token } = req.body || {};
    const user = users.find(u => u.id.toString() === userId?.toString());

    if (!user?.totpEnabled)
      return res.status(400).json({ error: '2FA no está activado' });

    const valid = speakeasy.totp.verify({
      secret:   user.totpSecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!valid) return res.status(401).json({ error: 'Código incorrecto' });

    return res.json({
      id:       user.id.toString(),
      email:    user.email,
      fullName: user.fullName,
      role:     user.role || 'Operador',
      dni:      user.dni  || 'Sin DNI',
      token:    `fake-jwt-token-smartdrive-${user.id}`
    });
  }

  next();
};

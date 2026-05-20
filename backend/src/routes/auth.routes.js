const express = require('express');

const { getFirestore } = require('../lib/firebaseAdmin');

const router = express.Router();
const USERNAME_FIELDS = ['username', 'name', 'user', 'fullName'];

async function findUserEmailByIdentifier(identifier) {
  const db = getFirestore();

  for (const field of USERNAME_FIELDS) {
    const snapshot = await db
      .collection('users')
      .where(field, '==', identifier)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const user = snapshot.docs[0].data();
      return typeof user.email === 'string' ? user.email.trim() : '';
    }
  }

  return '';
}

router.post('/resolve-user', async (req, res) => {
  const identifier = typeof req.body?.identifier === 'string' ? req.body.identifier.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  console.log('[LOGIN] identifier recibido', identifier);

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Completa Email o usuario y la contrasena para continuar',
    });
  }

  if (identifier.includes('@')) {
    console.log('[LOGIN] login por email');
    return res.json({
      success: true,
      email: identifier,
    });
  }

  console.log('[LOGIN] login por username');

  try {
    const email = await findUserEmailByIdentifier(identifier);

    if (!email) {
      console.log('[LOGIN] usuario no encontrado');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    console.log('[LOGIN] email resuelto', email);

    return res.json({
      success: true,
      email,
    });
  } catch (error) {
    console.error('[LOGIN] error resolviendo usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'No pudimos resolver el usuario. Revisa la configuracion de Firebase Admin.',
    });
  }
});

module.exports = router;

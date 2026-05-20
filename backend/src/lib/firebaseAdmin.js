const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function readServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  }

  return null;
}

function normalizeServiceAccount(serviceAccount) {
  if (!serviceAccount?.private_key) {
    return serviceAccount;
  }

  return {
    ...serviceAccount,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
  };
}

function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = normalizeServiceAccount(readServiceAccount());
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    serviceAccount?.project_id ||
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    'luxia-app';

  return admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    projectId,
  });
}

function getFirestore() {
  return getFirebaseAdminApp().firestore();
}

module.exports = {
  getFirestore,
};

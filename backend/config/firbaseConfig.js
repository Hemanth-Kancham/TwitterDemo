const admin = require("firebase-admin");
const serviceAccount = require("../service-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const storage = admin.storage();

module.exports = { admin, storage };

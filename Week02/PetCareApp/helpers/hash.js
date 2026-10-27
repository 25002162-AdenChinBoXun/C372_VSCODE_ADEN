const crypto = require('crypto');

function sha256Hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

module.exports = sha256Hash;

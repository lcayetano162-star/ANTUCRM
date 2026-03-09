const crypto = require('crypto');

function generateKey(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

console.log('--- PRODUCTION KEYS GENERATOR ---');
console.log('JWT_SECRET (32 bytes hex):');
console.log(generateKey());
console.log('\nENCRYPTION_KEY (32 bytes hex - 64 chars):');
console.log(generateKey());
console.log('\n--- Copy these to your .env file ---');

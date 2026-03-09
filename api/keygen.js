const fs = require('fs');
const crypto = require('crypto');

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

let env = fs.readFileSync('.env', 'utf8');

env = env.replace(
    'DATABASE_URL="postgresql://usuario:password@localhost:5432/antu_crm?schema=public"',
    'DATABASE_URL="file:./dev.db"'
);

env = env.replace(
    'JWT_PRIVATE_KEY_BASE64=',
    'JWT_PRIVATE_KEY_BASE64=' + Buffer.from(privateKey).toString('base64')
);

env = env.replace(
    'JWT_PUBLIC_KEY_BASE64=',
    'JWT_PUBLIC_KEY_BASE64=' + Buffer.from(publicKey).toString('base64')
);

fs.writeFileSync('.env', env);
console.log('Keys generated and .env updated.');

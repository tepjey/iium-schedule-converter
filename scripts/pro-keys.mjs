// SlipSnap Pro key tools, for the site's owner. Run with node from the repo root.
//
//   node scripts/pro-keys.mjs setup        Make the signing key pair (once). The private key
//                                          goes to .pro-private-key.json (never committed);
//                                          the public key goes to src/pro/publicKey.js.
//   node scripts/pro-keys.mjs upload       Send the private key to Cloudflare as the
//                                          PRO_PRIVATE_KEY secret, for the live site and the
//                                          beta. It's piped in, never printed.
//   node scripts/pro-keys.mjs gift <name>  Print a free Pro key, e.g. for a Ko-fi supporter.
//
// Keep .pro-private-key.json safe (a password manager is a good place). Anyone with it
// can make Pro keys; if it's lost, make a new pair and old keys stop working.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { generateKeyPair, signProKey } from '../server/proKey.js';

const PRIVATE_FILE = '.pro-private-key.json';
const PUBLIC_FILE = 'src/pro/publicKey.js';

const [command, name] = process.argv.slice(2);

if (command === 'setup') {
  if (existsSync(PRIVATE_FILE)) {
    console.error(`${PRIVATE_FILE} already exists. Delete it first to make a new pair (old keys will stop working).`);
    process.exit(1);
  }
  const { privateJwk, publicJwk } = await generateKeyPair();
  writeFileSync(PRIVATE_FILE, JSON.stringify(privateJwk));
  mkdirSync('src/pro', { recursive: true });
  const { kty, crv, x, y } = publicJwk;
  writeFileSync(
    PUBLIC_FILE,
    `// Checks SlipSnap Pro keys (see server/proKey.js). Made by scripts/pro-keys.mjs setup.\n` +
      `export const PRO_PUBLIC_KEY = ${JSON.stringify({ kty, crv, x, y })};\n`
  );
  console.log(`Saved the private key to ${PRIVATE_FILE} and the public key to ${PUBLIC_FILE}.`);
} else if (command === 'upload') {
  const secret = readFileSync(PRIVATE_FILE, 'utf8');
  for (const branch of ['main', 'v2']) {
    const args = ['wrangler', 'pages', 'secret', 'put', 'PRO_PRIVATE_KEY', '--project-name', 'slipsnap'];
    if (branch !== 'main') args.push('--env', 'preview');
    const result = spawnSync('npx', args, { input: secret, stdio: ['pipe', 'inherit', 'inherit'], shell: true });
    if (result.status !== 0) process.exit(result.status || 1);
  }
} else if (command === 'gift' && name) {
  const id = `gift-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
  console.log(await signProKey(id, readFileSync(PRIVATE_FILE, 'utf8')));
} else {
  console.log('Usage: node scripts/pro-keys.mjs setup | upload | gift <name>');
}

// SlipSnap Pro keys. A key is a short signed note ("this payment unlocked Pro"), so the
// site can check it on its own, even offline, with the public key in src/pro/publicKey.js.
// Only the server (and the owner's gift script) holds the private key that signs them.
//
// Format: SNAP1.<payload>.<signature>, both base64url. The payload is JSON:
//   { id: the Stripe Checkout Session id or "gift-<name>", t: when it was issued (ms) }
// Signed with ECDSA P-256 / SHA-256, which every browser's Web Crypto supports.

const ALGORITHM = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGNING = { name: 'ECDSA', hash: 'SHA-256' };
const PREFIX = 'SNAP1';

const toBase64Url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const importPrivateKey = (jwk) =>
  crypto.subtle.importKey('jwk', typeof jwk === 'string' ? JSON.parse(jwk) : jwk, ALGORITHM, false, ['sign']);

// A signed Pro key for `id`. `privateJwk` is the PRO_PRIVATE_KEY secret (a JWK, as JSON).
export const signProKey = async (id, privateJwk) => {
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify({ id, t: Date.now() })));
  const key = await importPrivateKey(privateJwk);
  const signature = await crypto.subtle.sign(SIGNING, key, new TextEncoder().encode(`${PREFIX}.${payload}`));
  return `${PREFIX}.${payload}.${toBase64Url(signature)}`;
};

// A new key pair, as JWKs. Used once, by scripts/pro-keys.mjs.
export const generateKeyPair = async () => {
  const pair = await crypto.subtle.generateKey(ALGORITHM, true, ['sign', 'verify']);
  const [privateJwk, publicJwk] = await Promise.all([
    crypto.subtle.exportKey('jwk', pair.privateKey),
    crypto.subtle.exportKey('jwk', pair.publicKey),
  ]);
  return { privateJwk, publicJwk };
};

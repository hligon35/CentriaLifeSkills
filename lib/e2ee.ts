// E2EE utilities (AES-GCM). In production, perform key exchange (e.g., X25519) and store encrypted keys per conversation.
// Insert organization-specific key management (KMS/HSM) integration here if desired.

export async function importAesKey(rawKey: ArrayBuffer) {
  return await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

export async function generateAesKey() {
  return await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
}

export async function encrypt(plaintext: string, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ct))),
    iv: btoa(String.fromCharCode(...iv))
  }
}

export async function decrypt(ciphertextB64: string, ivB64: string, key: CryptoKey) {
  const toBytes = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const iv = toBytes(ivB64)
  const ct = toBytes(ciphertextB64)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(pt)
}

export async function deriveKeyFromPassphrase(passphrase: string, salt: ArrayBuffer) {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

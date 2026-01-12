const subtle = typeof crypto !== "undefined" ? crypto.subtle : null;

function toUint8(str) {
  return new TextEncoder().encode(str);
}

function base64FromBytes(bytes) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function bytesFromBase64(str) {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(str, "base64"));
  }
  const binary = atob(str);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

function randomBytes(length) {
  const out = new Uint8Array(length);
  if (!crypto?.getRandomValues) {
    throw new Error("Crypto not available for random generation");
  }
  crypto.getRandomValues(out);
  return out;
}

async function deriveKey(password, salt, { iterations, digest, keyLength }) {
  if (!subtle) throw new Error("Web Crypto not available for PBKDF2");
  const keyMaterial = await subtle.importKey("raw", toUint8(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: digest,
    },
    keyMaterial,
    keyLength * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password, options) {
  const salt = randomBytes(options.saltBytes);
  const derived = await deriveKey(password, salt, options);
  const saltB64 = base64FromBytes(salt);
  const hashB64 = base64FromBytes(derived);
  return `pbkdf2$${options.digest.toLowerCase()}$${options.iterations}$${saltB64}$${hashB64}`;
}

export function parseHash(stored) {
  const parts = stored.split("$");
  if (parts.length !== 5 || parts[0] !== "pbkdf2") {
    throw new Error("Unsupported hash format");
  }
  const [, digestRaw, iterStr, saltB64, hashB64] = parts;
  let digest = digestRaw.toUpperCase();
  if (!digest.includes("-") && digest.startsWith("SHA")) {
    digest = `SHA-${digest.slice(3)}`;
  }
  return {
    digest,
    iterations: Number(iterStr),
    salt: bytesFromBase64(saltB64),
    hash: bytesFromBase64(hashB64),
  };
}

export async function verifyPassword(password, storedHash, options) {
  const parsed = parseHash(storedHash);
  const derived = await deriveKey(password, parsed.salt, {
    iterations: parsed.iterations || options.iterations,
    digest: parsed.digest || options.digest,
    keyLength: options.keyLength,
  });
  if (derived.length !== parsed.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i += 1) {
    diff |= derived[i] ^ parsed.hash[i];
  }
  return diff === 0;
}
/* global crypto, Buffer, TextEncoder, btoa, atob */

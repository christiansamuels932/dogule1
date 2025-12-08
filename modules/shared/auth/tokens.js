const subtle = typeof crypto !== "undefined" ? crypto.subtle : null;

function toUint8(input) {
  return typeof input === "string" ? new TextEncoder().encode(input) : input;
}

function base64UrlEncode(bytes) {
  if (typeof bytes === "string") {
    return base64UrlEncode(toUint8(bytes));
  }
  let b64;
  if (typeof Buffer !== "undefined") {
    b64 = Buffer.from(bytes).toString("base64");
  } else {
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    b64 = btoa(binary);
  }
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64");
  }
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacSha256(message, secret) {
  if (!subtle) throw new Error("Web Crypto not available for HMAC");
  const key = await subtle.importKey(
    "raw",
    toUint8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return new Uint8Array(await subtle.sign("HMAC", key, toUint8(message)));
}

export async function createSignedToken(payload, secret) {
  const header = { alg: "HS256", typ: "DOGULE1" };
  const body =
    base64UrlEncode(JSON.stringify(header)) + "." + base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(await hmacSha256(body, secret));
  return `${body}.${signature}`;
}

export async function verifySignedToken(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [headerB64, payloadB64, sigB64] = parts;
  const body = `${headerB64}.${payloadB64}`;
  const expectedSig = base64UrlEncode(await hmacSha256(body, secret));
  if (sigB64 !== expectedSig) throw new Error("Signature mismatch");
  const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadB64));
  return JSON.parse(payloadJson);
}

export function nowMs() {
  return Date.now();
}

export function randomId(bytes = 16) {
  const arr = new Uint8Array(bytes);
  if (!crypto?.getRandomValues) {
    throw new Error("Crypto not available for random generation");
  }
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr);
}
/* global crypto, Buffer, TextEncoder, TextDecoder, btoa, atob */

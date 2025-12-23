/* global process */
import crypto from "node:crypto";

function readEnv(key, fallback) {
  if (typeof process !== "undefined" && process?.env?.[key]) return process.env[key];
  if (typeof import.meta !== "undefined" && import.meta.env?.[key]) return import.meta.env[key];
  return fallback;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function normalizeRecipients(list = []) {
  return list
    .map((entry) => (entry || "").trim())
    .filter(Boolean)
    .map((address) => ({ emailAddress: { address } }));
}

export function resolveOutlookConfig(overrides = {}) {
  return {
    accessToken: overrides.accessToken ?? readEnv("DOGULE1_OUTLOOK_ACCESS_TOKEN", "")?.trim() ?? "",
    sender: overrides.sender ?? readEnv("DOGULE1_OUTLOOK_SENDER", "")?.trim() ?? "",
    tenantId: overrides.tenantId ?? readEnv("DOGULE1_OUTLOOK_TENANT_ID", "")?.trim() ?? "",
    dryRun: parseBoolean(overrides.dryRun ?? readEnv("DOGULE1_OUTLOOK_DRY_RUN", "false"), false),
  };
}

export function createOutlookConnector(options = {}) {
  const config = resolveOutlookConfig(options.config || {});
  const fetcher = options.fetcher || globalThis?.fetch;
  const tokenProvider = options.tokenProvider;

  async function resolveToken() {
    if (typeof tokenProvider === "function") {
      return tokenProvider();
    }
    return { accessToken: config.accessToken };
  }

  async function sendEmail(payload = {}) {
    const token = await resolveToken();
    if (!token?.accessToken) {
      return { status: "failed", error: "missing_token" };
    }

    if (config.dryRun || typeof fetcher !== "function") {
      return {
        status: "sent",
        provider: "outlook",
        providerMessageId: crypto.randomUUID
          ? crypto.randomUUID()
          : `outlook-${Math.random().toString(36).slice(2)}`,
        simulated: true,
      };
    }

    const url = config.sender
      ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.sender)}/sendMail`
      : "https://graph.microsoft.com/v1.0/me/sendMail";
    const message = {
      subject: payload.subject || "",
      body: {
        contentType: "Text",
        content: payload.body || "",
      },
      toRecipients: normalizeRecipients(payload.to),
      ccRecipients: normalizeRecipients(payload.cc),
      bccRecipients: normalizeRecipients(payload.bcc),
    };

    const res = await fetcher(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    });

    if (!res || !res.ok) {
      return {
        status: "failed",
        provider: "outlook",
        error: `outlook_error_${res?.status || "unknown"}`,
      };
    }

    return {
      status: "sent",
      provider: "outlook",
      providerMessageId: res.headers?.get?.("request-id") || null,
    };
  }

  return {
    config,
    sendEmail,
  };
}

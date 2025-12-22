/* global document, window, Response, process, global, URL, setTimeout */
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initModule } from "../index.js";
import { createGroupchatSal } from "./sal.js";
import { createGroupchatApiHandlers } from "./apiRoutes.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-groupchat-ui");

async function makeTempRoot() {
  const dir = path.join(TMP_ROOT, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

function setupFetch(api) {
  global.fetch = async (url, options = {}) => {
    const parsed = new URL(url, "http://localhost");
    const pathname = parsed.pathname;
    const search = Object.fromEntries(parsed.searchParams.entries());
    const body = options.body ? JSON.parse(options.body) : {};
    const actor = { id: "test-user", role: "admin" };
    const authz = {
      allowedActions: [
        "kommunikation.chat.send",
        "kommunikation.chat.read",
        "kommunikation.chat.readMarker.set",
      ],
    };
    const req = { query: search, body, actor, authz };
    const res = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader(name, value) {
        this.headers[name.toLowerCase()] = value;
      },
      end(payload) {
        this.body = payload;
      },
    };
    if (pathname === "/api/kommunikation/groupchat/messages" && options.method === "POST") {
      await api.handleSendMessage(req, res);
    } else if (pathname === "/api/kommunikation/groupchat/messages") {
      await api.handleListMessages(req, res);
    } else if (
      pathname === "/api/kommunikation/groupchat/read-marker" &&
      options.method === "POST"
    ) {
      await api.handleSetReadMarker(req, res);
    } else if (pathname === "/api/kommunikation/groupchat/read-marker") {
      await api.handleGetReadMarker(req, res);
    } else {
      res.statusCode = 404;
      res.body = JSON.stringify({ error: "not_found" });
    }
    return new Response(res.body || "", { status: res.statusCode, headers: res.headers });
  };
}

function ensureTemplates() {
  const notice = document.createElement("template");
  notice.id = "ui-notice";
  notice.innerHTML = `
    <section class="ui-notice">
      <div class="ui-notice__content"></div>
    </section>
  `;
  document.body.appendChild(notice);

  const empty = document.createElement("template");
  empty.id = "ui-empty";
  empty.innerHTML = `
    <section class="ui-empty">
      <div class="ui-empty__title"></div>
      <div class="ui-empty__hint"></div>
      <div class="ui-empty__actions"></div>
    </section>
  `;
  document.body.appendChild(empty);
}

describe("Kommunikation Chats UI", () => {
  let root;

  beforeEach(async () => {
    root = await makeTempRoot();
    window.__DOGULE_STORAGE_PROBE__ = async () => {};
    window.__DOGULE_ACTOR__ = { id: "test-user", role: "admin" };
    window.__DOGULE_AUTHZ__ = {
      allowedActions: [
        "kommunikation.chat.view",
        "kommunikation.chat.send",
        "kommunikation.chat.read",
        "kommunikation.chat.readMarker.set",
      ],
    };
    ensureTemplates();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("sends a message and shows it after refresh", async () => {
    const sal = createGroupchatSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
    });
    const api = createGroupchatApiHandlers({ sal });
    setupFetch(api);

    const container = document.createElement("div");
    await initModule(container, { segments: ["chats", "global"] });
    const textarea = container.querySelector("textarea");
    const sendButton = container.querySelector(".kommunikation-send");
    expect(textarea).toBeTruthy();
    textarea.value = "Testnachricht";
    sendButton.click();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.textContent).toContain("Testnachricht");

    // Refresh
    await initModule(container, { segments: ["chats", "global"] });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.textContent).toContain("Testnachricht");
  });
});

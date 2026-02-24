/* global document, window, Response, global, URL, setTimeout, process */
import path from "node:path";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { initModule } from "../index.js";
import { createInfochannelSal } from "../infochannel/sal.js";
import { createInfochannelApiHandlers } from "../infochannel/apiRoutes.js";

const TMP_ROOT = path.join(process.cwd(), ".tmp-groupchat-ui");
const RICHARD_ID = "99999999-9999-9999-9999-999999999999";
const TRAINER_ID = "11111111-1111-1111-1111-111111111111";

async function makeTempRoot() {
  const dir = path.join(TMP_ROOT, crypto.randomUUID());
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanup(dir) {
  await fs.rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
}

function setupFetch(api) {
  const handler = async (url, options = {}) => {
    const parsed = new URL(url, "http://localhost");
    const pathname = parsed.pathname;
    const query = Object.fromEntries(parsed.searchParams.entries());
    const body = options.body ? JSON.parse(options.body) : {};
    const actor = window.__DOGULE_ACTOR__ || { id: null, role: null };
    const authz = window.__DOGULE_AUTHZ__ || { allowedActions: [] };

    const req = { query, body, actor, authz, params: {} };
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

    const method = (options.method || "GET").toUpperCase();
    if (pathname === "/api/kommunikation/infochannel/notices" && method === "POST") {
      await api.handleCreateNotice(req, res);
    } else if (pathname === "/api/kommunikation/infochannel/notices") {
      await api.handleListNotices(req, res);
    } else if (/^\/api\/kommunikation\/infochannel\/notices\/[^/]+\/confirm$/.test(pathname)) {
      req.params.id = pathname.split("/").slice(-2, -1)[0];
      await api.handleConfirmNotice(req, res);
    } else if (/^\/api\/kommunikation\/infochannel\/notices\/[^/]+$/.test(pathname)) {
      req.params.id = pathname.split("/").pop();
      if (method === "DELETE") {
        await api.handleDeleteNotice(req, res);
      } else {
        await api.handleGetNotice(req, res);
      }
    } else {
      res.statusCode = 404;
      res.body = JSON.stringify({ error: "not_found" });
    }
    return new Response(res.body || "", { status: res.statusCode, headers: res.headers });
  };

  global.fetch = handler;
  window.fetch = handler;
}

function ensureTemplates() {
  const button = document.createElement("template");
  button.id = "ui-btn";
  button.innerHTML = `<button type="button" class="ui-btn"></button>`;
  document.body.appendChild(button);

  const formRow = document.createElement("template");
  formRow.id = "ui-form-row-template";
  formRow.innerHTML = `
    <div class="ui-form-row">
      <label class="ui-form-row__label"></label>
      <div class="ui-form-row__control"></div>
      <div class="ui-form-row__hint sr-only"></div>
    </div>
  `;
  document.body.appendChild(formRow);

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

function trainerList() {
  return [
    { id: RICHARD_ID, code: "TR-001", name: "Fontana Richard" },
    { id: TRAINER_ID, code: "TR-002", name: "Trainer A" },
  ];
}

describe("Kommunikation Infochannel UI", () => {
  let root;

  beforeEach(async () => {
    root = await makeTempRoot();
    ensureTemplates();
  });

  afterEach(async () => {
    await cleanup(root);
  });

  it("renders infochannel list and detail", async () => {
    const sal = createInfochannelSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
      listTrainers: async () => trainerList(),
      now: () => "2025-01-01T00:00:00.000Z",
    });
    const notice = await sal.publishNotice(
      { title: "Hinweis", body: "Bitte lesen." },
      {
        actorId: `user-${RICHARD_ID}`,
        actorRole: "admin",
        authz: { allowedActions: ["kommunikation.infochannel.publish"] },
      }
    );
    const api = createInfochannelApiHandlers({ sal });
    setupFetch(api);

    window.__DOGULE_ACTOR__ = { id: `user-${RICHARD_ID}`, role: "admin" };
    window.__DOGULE_AUTHZ__ = {
      allowedActions: ["kommunikation.infochannel.view", "kommunikation.infochannel.publish"],
    };
    window.__DOGULE_STORAGE_PROBE__ = async () => {};

    const container = document.createElement("div");
    await initModule(container, { segments: ["infochannel"] });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.textContent).toContain("Hinweis");

    await initModule(container, { segments: ["infochannel", notice.id] });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.textContent).toContain("Bitte lesen.");
  });

  it("allows trainer confirmation in detail view", async () => {
    const sal = createInfochannelSal({
      mode: "real",
      paths: { root },
      rateLimiter: () => ({ allowed: true, remaining: 1, resetAt: Date.now() + 1000 }),
      listTrainers: async () => trainerList(),
      now: () => "2025-01-01T00:00:00.000Z",
    });
    const notice = await sal.publishNotice(
      { title: "SLA", body: "Bitte bestätigen." },
      {
        actorId: `user-${RICHARD_ID}`,
        actorRole: "admin",
        authz: { allowedActions: ["kommunikation.infochannel.publish"] },
      }
    );
    const api = createInfochannelApiHandlers({ sal });
    setupFetch(api);

    window.__DOGULE_ACTOR__ = { id: TRAINER_ID, role: "trainer" };
    window.__DOGULE_AUTHZ__ = {
      allowedActions: ["kommunikation.infochannel.view", "kommunikation.infochannel.confirm"],
    };
    window.__DOGULE_STORAGE_PROBE__ = async () => {};

    const container = document.createElement("div");
    await initModule(container, { segments: ["infochannel", notice.id] });
    await new Promise((resolve) => setTimeout(resolve, 10));

    const confirmBtn = container.querySelector(".infochannel-confirm .ui-btn");
    expect(confirmBtn).toBeTruthy();
    confirmBtn.click();
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(container.textContent).toContain("Bestätigt");
  });
});

// READ-ONLY: Zertifikate renderer is locked. If you edit this file, log a note in status.md.
/* globals URL, Blob, window */
const CERT_BG_URL = new URL("../../Material/zertifikat_bg_a4_300dpi.png", import.meta.url).href;

const LAYOUT = {
  textColor: "#232323",
  minScale: 0.85,
  blocks: {
    participantLine1: { x: 18, y: 33.2, w: 64, h: 3, fontSize: 11.5, align: "center" },
    kundeName: {
      x: 18,
      y: 34.0,
      w: 64,
      h: 5,
      fontSize: 17.5,
      weight: 700,
      align: "center",
      color: "#2f5ea8",
    },
    participantLine3: { x: 18, y: 37.0, w: 64, h: 3, fontSize: 11.5, align: "center" },
    hundLine: {
      x: 18,
      y: 38.4,
      w: 64,
      h: 3.5,
      fontSize: 11.8,
      weight: 700,
      align: "center",
      color: "#2f5ea8",
    },
    kursTitelTop: {
      x: 18,
      y: 22.4,
      w: 64,
      h: 4,
      fontSize: 22.8,
      weight: 700,
      align: "center",
      color: "#2f5ea8",
    },
    kursTeilnahmeSatz: { x: 16, y: 39.7, w: 68, h: 4, fontSize: 11.5, align: "center" },
    kursTheorie: {
      x: 19.2,
      y: 46.8,
      w: 36,
      h: 12,
      fontSize: 10.8,
      lineHeight: 1.35,
      maxLines: 6,
    },
    kursPraxis: {
      x: 53.7,
      y: 46.8,
      w: 36,
      h: 12,
      fontSize: 10.8,
      lineHeight: 1.35,
      maxLines: 6,
    },
    gratulationSatz: { x: 16, y: 56.2, w: 68, h: 3, fontSize: 11.5, align: "center" },
    ausstellungsdatum: { x: 18, y: 57.9, w: 64, h: 3, fontSize: 10.8, align: "center" },
    trainer1Name: { x: 13.9, y: 60.2, w: 25, h: 3, fontSize: 12, weight: 700, align: "center" },
    trainer1Titel: { x: 13.9, y: 63.0, w: 25, h: 3, fontSize: 10.5, align: "center" },
    trainer2Name: { x: 60.5, y: 60.2, w: 25, h: 3, fontSize: 12, weight: 700, align: "center" },
    trainer2Titel: { x: 60.5, y: 63.0, w: 25, h: 3, fontSize: 10.5, align: "center" },
    zertifikatId: {
      x: 4,
      y: 96.5,
      w: 92,
      h: 2.2,
      fontSize: 8.5,
      align: "center",
      color: "#ffffff",
      opacity: 0.8,
    },
  },
};

const REQUIRED_FIELDS = [
  "code",
  "kundeNameSnapshot",
  "hundNameSnapshot",
  "hundRasseSnapshot",
  "hundGeschlechtSnapshot",
  "kursTitelSnapshot",
  "kursDatumSnapshot",
  "kursOrtSnapshot",
  "kursInhaltTheorieSnapshot",
  "kursInhaltPraxisSnapshot",
  "ausstellungsdatum",
  "trainer1NameSnapshot",
  "trainer1TitelSnapshot",
];

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeGender(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "";
  return normalized;
}

function resolveGratulationWord(gender) {
  const normalized = normalizeGender(gender);
  if (normalized === "weiblich") return "Hundeführerin";
  if (normalized === "männlich") return "Hundeführer";
  return "Hundeführerin";
}

export function validateCertificateSnapshot(snapshot = {}) {
  const missing = REQUIRED_FIELDS.filter((key) => !(snapshot[key] || "").toString().trim());
  if ((snapshot.trainer2NameSnapshot || "").toString().trim()) {
    if (!(snapshot.trainer2TitelSnapshot || "").toString().trim()) {
      missing.push("trainer2TitelSnapshot");
    }
  }
  return missing;
}

export function buildCertificateHtml(snapshot = {}) {
  const kundeName = snapshot.kundeNameSnapshot || "—";
  const dogLine = joinParts([
    snapshot.hundRasseSnapshot,
    snapshot.hundGeschlechtSnapshot,
    snapshot.hundNameSnapshot,
  ]);
  const kursName = snapshot.kursTitelSnapshot || "—";
  const handlerWord = resolveGratulationWord(snapshot.kundeGeschlechtSnapshot);
  const theorieLines = parseBulletLines(snapshot.kursInhaltTheorieSnapshot);
  const praxisLines = parseBulletLines(snapshot.kursInhaltPraxisSnapshot);
  const formattedDate = formatDate(snapshot.ausstellungsdatum);

  return `<!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8" />
      <title>Zertifikat_${escapeHtml(snapshot.code || "")}.pdf</title>
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body {
          font-family: "Times New Roman", Georgia, serif;
          color: ${LAYOUT.textColor};
          margin: 0;
          background: #ffffff;
        }
        .page {
          position: relative;
          width: 210mm;
          height: 297mm;
          background: url("${CERT_BG_URL}") no-repeat center top;
          background-size: cover;
        }
        .text-block {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          overflow: hidden;
        }
        .text-left {
          justify-content: flex-start;
          text-align: left;
        }
        .kurs-sentence span[data-inline] {
          font-weight: 700;
        }
        .kurs-list {
          position: absolute;
          margin: 0;
          padding: 0 0 0 14px;
          list-style: disc;
          white-space: normal;
          word-break: normal;
          overflow-wrap: break-word;
          overflow: hidden;
        }
        .kurs-list li {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="text-block" data-fit="text" style="${blockStyle("participantLine1")}">
          ${escapeHtml("Hiermit bestätigen wir, dass")}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("kundeName")}">
          ${escapeHtml(kundeName)}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("participantLine3")}">
          ${escapeHtml("mit dem")}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("hundLine")}">
          ${escapeHtml(dogLine || "—")}
        </div>
        <div class="text-block" data-fit="inline" style="${blockStyle("kursTitelTop")}">
          <span data-inline>${escapeHtml(kursName)}</span>
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("kursTeilnahmeSatz")}">
          ${escapeHtml(`am Kurs "${kursName}" erfolgreich teilgenommen hat.`)}
        </div>
        <ul class="kurs-list" data-fit="list" style="${blockStyle("kursTheorie", true)}">
          ${buildBulletItems(theorieLines, LAYOUT.blocks.kursTheorie.maxLines)}
        </ul>
        <ul class="kurs-list" data-fit="list" style="${blockStyle("kursPraxis", true)}">
          ${buildBulletItems(praxisLines, LAYOUT.blocks.kursPraxis.maxLines)}
        </ul>
        <div class="text-block" data-fit="text" style="${blockStyle("gratulationSatz")}">
          ${escapeHtml(`Wir gratulieren der ${handlerWord} zu dieser Leistung und danken für das Engagement.`)}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("ausstellungsdatum")}">
          ${escapeHtml(`Döttingen, ${formattedDate}`)}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("trainer1Name")}">
          ${escapeHtml(snapshot.trainer1NameSnapshot || "—")}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("trainer1Titel")}">
          ${escapeHtml(snapshot.trainer1TitelSnapshot || "")}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("trainer2Name")}">
          ${escapeHtml(snapshot.trainer2NameSnapshot || "")}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("trainer2Titel")}">
          ${escapeHtml(snapshot.trainer2TitelSnapshot || "")}
        </div>
        <div class="text-block" data-fit="text" style="${blockStyle("zertifikatId")}">
          ${escapeHtml(`Zertifikat-ID: ${snapshot.id || "—"}`)}
        </div>
      </div>
      <script>
        const minScale = ${LAYOUT.minScale};
        const fitNodes = Array.from(document.querySelectorAll("[data-fit]"));

        const setFontSize = (node, size) => {
          node.style.fontSize = size + "px";
        };

        const truncateText = (node) => {
          const fullText = node.dataset.fullText || node.textContent || "";
          node.dataset.fullText = fullText;
          let low = 0;
          let high = fullText.length;
          let best = fullText;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = fullText.slice(0, mid).trim() + (mid < fullText.length ? "…" : "");
            node.textContent = candidate;
            if (node.scrollHeight <= node.clientHeight + 1) {
              best = candidate;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          node.textContent = best;
        };

        const truncateInline = (node) => {
          const target = node.querySelector("[data-inline]");
          if (!target) {
            truncateText(node);
            return;
          }
          const fullText = target.dataset.fullText || target.textContent || "";
          target.dataset.fullText = fullText;
          let low = 0;
          let high = fullText.length;
          let best = fullText;
          while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const candidate = fullText.slice(0, mid).trim() + (mid < fullText.length ? "…" : "");
            target.textContent = candidate;
            if (node.scrollHeight <= node.clientHeight + 1) {
              best = candidate;
              low = mid + 1;
            } else {
              high = mid - 1;
            }
          }
          target.textContent = best;
        };

        const truncateList = (node) => {
          const items = Array.from(node.querySelectorAll("li"));
          if (!items.length) return;
          while (node.scrollHeight > node.clientHeight + 1 && items.length > 1) {
            const last = items.pop();
            last?.remove();
          }
          const lastItem = items[items.length - 1];
          if (lastItem && node.scrollHeight > node.clientHeight + 1) {
            const fullText = lastItem.dataset.fullText || lastItem.textContent || "";
            lastItem.dataset.fullText = fullText;
            let low = 0;
            let high = fullText.length;
            let best = fullText;
            while (low <= high) {
              const mid = Math.floor((low + high) / 2);
              const candidate = fullText.slice(0, mid).trim() + (mid < fullText.length ? "…" : "");
              lastItem.textContent = candidate;
              if (node.scrollHeight <= node.clientHeight + 1) {
                best = candidate;
                low = mid + 1;
              } else {
                high = mid - 1;
              }
            }
            lastItem.textContent = best;
          }
        };

        const fitNode = (node) => {
          const baseSize = parseFloat(getComputedStyle(node).fontSize);
          const minSize = baseSize * minScale;
          let size = baseSize;
          while (node.scrollHeight > node.clientHeight + 1 && size > minSize + 0.1) {
            size -= baseSize * 0.03;
            setFontSize(node, size);
          }
          if (node.scrollHeight > node.clientHeight + 1) {
            const type = node.dataset.fit;
            if (type === "inline") truncateInline(node);
            else if (type === "list") truncateList(node);
            else truncateText(node);
          }
        };

        const runFit = () => {
          fitNodes.forEach((node) => fitNode(node));
        };

        window.addEventListener("load", () => {
          runFit();
          setTimeout(runFit, 100);
        });
      </script>
    </body>
  </html>`;
}

export function openCertificatePdf(snapshot = {}) {
  const missing = validateCertificateSnapshot(snapshot);
  if (missing.length) {
    const error = new Error("Missing certificate fields");
    error.missing = missing;
    throw error;
  }

  const html = buildCertificateHtml(snapshot);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    const error = new Error("Popup blocked");
    error.code = "POPUP_BLOCKED";
    throw error;
  }
  win.focus();
  const cleanup = () => {
    URL.revokeObjectURL(url);
  };
  win.addEventListener("load", () => {
    try {
      window.setTimeout(() => {
        win.print();
      }, 300);
    } finally {
      window.setTimeout(cleanup, 1000);
    }
  });
}

function parseBulletLines(value = "") {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function joinParts(parts = []) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" · ");
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

function buildBulletItems(lines = [], maxLines = 6) {
  const trimmed = (Array.isArray(lines) ? lines : []).map((line) => line.trim()).filter(Boolean);
  const safeLines = trimmed.slice(0, maxLines);
  if (trimmed.length > maxLines && safeLines.length) {
    safeLines[safeLines.length - 1] = `${safeLines[safeLines.length - 1]}…`;
  }
  return safeLines.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function blockStyle(key, isList = false) {
  const block = LAYOUT.blocks[key];
  const weight = block.weight || 400;
  const lineHeight = block.lineHeight || 1.2;
  const base = [
    `left:${block.x}%`,
    `top:${block.y}%`,
    `width:${block.w}%`,
    `height:${block.h}%`,
    `font-size:${block.fontSize}pt`,
    `font-weight:${weight}`,
    `line-height:${lineHeight}`,
  ];
  if (isList) {
    base.push(`text-align:left`);
  }
  if (block.color) {
    base.push(`color:${block.color}`);
  }
  if (block.opacity !== undefined) {
    base.push(`opacity:${block.opacity}`);
  }
  return base.join(";");
}

/* globals URL */
const CERTIFICATE_BACKGROUND_FILES = [
  { value: "zertifikat_bg_a4_300dpi.png", label: "Standard" },
  { value: "zertifikat_bg_junghunde_a4_300dpi.png", label: "Junghunde" },
  { value: "zertifikat_bg_welpen_a4_300dpi.png", label: "Welpen" },
];

const COURSE_BACKGROUND_BY_CODE = {
  "KS-001": "zertifikat_bg_welpen_a4_300dpi.png",
  "KS-002": "zertifikat_bg_junghunde_a4_300dpi.png",
  "KS-003": "zertifikat_bg_a4_300dpi.png",
  "KS-004": "zertifikat_bg_junghunde_a4_300dpi.png",
  "KS-005": "zertifikat_bg_a4_300dpi.png",
  "KS-006": "zertifikat_bg_a4_300dpi.png",
  "KS-007": "zertifikat_bg_a4_300dpi.png",
  "KS-008": "zertifikat_bg_a4_300dpi.png",
  "KS-009": "zertifikat_bg_a4_300dpi.png",
  "KS-010": "zertifikat_bg_a4_300dpi.png",
  "KS-011": "zertifikat_bg_a4_300dpi.png",
  "KS-012": "zertifikat_bg_a4_300dpi.png",
  "KS-013": "zertifikat_bg_a4_300dpi.png",
};

const normalizeBackgroundFile = (value = "") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:")) return trimmed;
  const fileName = trimmed.split("/").pop();
  if (!fileName || !fileName.toLowerCase().endsWith(".png")) return "";
  return fileName;
};

export function getCertificateBackgroundForKurs(kurs = {}) {
  const direct = normalizeBackgroundFile(kurs?.zertifikatHintergrund || "");
  if (direct) return direct;
  const code = String(kurs?.code || "").trim();
  return COURSE_BACKGROUND_BY_CODE[code] || "";
}

export function getCertificateBackgroundOptions(selectedValue = "") {
  const normalized = normalizeBackgroundFile(selectedValue);
  return [
    {
      value: "",
      label: "Bitte wählen",
      selected: !normalized,
    },
    ...CERTIFICATE_BACKGROUND_FILES.map((entry) => ({
      value: entry.value,
      label: `${entry.label} (${entry.value})`,
      selected: entry.value === normalized,
    })),
  ];
}

export function describeCertificateBackground(value = "") {
  const normalized = normalizeBackgroundFile(value);
  if (!normalized) return "";
  const match = CERTIFICATE_BACKGROUND_FILES.find((entry) => entry.value === normalized);
  return match ? `${match.label} (${match.value})` : normalized;
}

export function resolveCertificateBackgroundUrl(value = "") {
  const normalized = normalizeBackgroundFile(value);
  if (!normalized) return "";
  if (normalized.startsWith("data:")) return normalized;
  return new URL(`../../../attachments/material/Material/${normalized}`, import.meta.url).href;
}

export const HERKUNFT_OPTIONS = [
  { value: "", label: "Bitte wählen" },
  { value: "privat", label: "Privat" },
  { value: "züchter", label: "Züchter" },
  { value: "tierheim", label: "Tierheim" },
  { value: "tierschutz", label: "Tierschutz" },
  { value: "internet", label: "Internet" },
  { value: "zoohandel", label: "Zoohandel" },
];

const HERKUNFT_LABELS = new Map(
  HERKUNFT_OPTIONS.filter((option) => option.value).map((option) => [option.value, option.label])
);

export function formatHerkunft(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  return HERKUNFT_LABELS.get(normalized) || normalized;
}

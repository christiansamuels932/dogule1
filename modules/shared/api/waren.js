import { list } from "./crud.js";

const TABLE = "waren";

const EDITABLE_DEFAULTS = {
  code: "",
  kundenId: "",
  produktName: "",
  menge: 1,
  preis: 0,
  datum: "",
  beschreibung: "",
};

const ensureWarenShape = (entry = {}) => ({
  id: "",
  createdAt: "",
  updatedAt: "",
  ...EDITABLE_DEFAULTS,
  ...entry,
});

export async function listWaren(options) {
  const waren = await list(TABLE, options);
  return waren.map(ensureWarenShape);
}

export async function listWarenByKundeId(kundenId, options) {
  const waren = await listWaren(options);
  return waren.filter((verkauf) => verkauf.kundenId === kundenId);
}

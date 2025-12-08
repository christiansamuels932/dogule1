const stableStringify = (value) => JSON.stringify(sortValue(value), null, 2) + "\n";

function sortValue(val) {
  if (Array.isArray(val)) {
    return val.map(sortValue);
  }
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const sortedKeys = Object.keys(val).sort();
    const out = {};
    for (const key of sortedKeys) {
      out[key] = sortValue(val[key]);
    }
    return out;
  }
  return val;
}

export function canonicalJson(value) {
  return stableStringify(value);
}

export function canonicalHashInput(value) {
  return JSON.stringify(sortValue(value));
}

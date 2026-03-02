export function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export function normalizePhoneDigits(value) {
  return String(value || "").replace(/\D+/g, "");
}

function buildPhoneVariants(value) {
  const digits = normalizePhoneDigits(value);
  const variants = new Set();
  if (!digits) return variants;
  variants.add(digits);
  if (digits.startsWith("0041")) {
    variants.add(`0${digits.slice(4)}`);
    variants.add(`41${digits.slice(4)}`);
  }
  if (digits.startsWith("41") && digits.length > 2) {
    variants.add(`0${digits.slice(2)}`);
  }
  if (digits.startsWith("0") && digits.length > 1) {
    variants.add(`41${digits.slice(1)}`);
    variants.add(`0041${digits.slice(1)}`);
  }
  return variants;
}

export function matchesSearchQuery(
  query,
  { textFields = [], phoneFields = [], fallbackPhoneFields = [] } = {}
) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const haystack = textFields
    .filter(Boolean)
    .map((field) => normalizeSearchText(field))
    .join(" ");
  if (haystack.includes(normalizedQuery)) {
    return true;
  }

  const queryDigits = normalizePhoneDigits(query);
  if (!queryDigits) {
    return false;
  }

  const candidateFields = phoneFields.length ? phoneFields : fallbackPhoneFields;
  const queryVariants = buildPhoneVariants(query);
  return candidateFields.some((field) => {
    const fieldVariants = buildPhoneVariants(field);
    for (const candidate of fieldVariants) {
      for (const needle of queryVariants) {
        if (candidate.includes(needle) || needle.includes(candidate)) {
          return true;
        }
      }
    }
    return false;
  });
}

export function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    rows.push(row);
    row = [];
  };

  while (i < content.length) {
    const char = content[i];
    if (inQuotes) {
      if (char === '"') {
        const next = content[i + 1];
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (char === "\n") {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }

  return rows;
}

export function parseCsvWithHeaders(content) {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return { headers: [], records: [] };
  }
  const headers = rows[0].map((value) => value.trim());
  const records = [];
  for (const row of rows.slice(1)) {
    if (row.length === 0 || row.every((value) => value === "")) continue;
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    records.push(record);
  }
  return { headers, records };
}

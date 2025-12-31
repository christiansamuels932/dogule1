export async function exportTableToXlsx({ fileName, sheetName, columns, rows }) {
  const XLSX = await import("xlsx");
  const { utils, writeFile } = XLSX;
  const headerRow = columns.map((column) => column.label);
  const dataRows = rows.map((row) =>
    columns.map((column) => {
      const value = typeof column.value === "function" ? column.value(row) : row[column.key];
      return value === undefined || value === null ? "" : String(value);
    })
  );

  const sheet = utils.aoa_to_sheet([headerRow, ...dataRows]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, sheetName);
  writeFile(workbook, fileName);
}

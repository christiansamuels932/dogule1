import fs from "node:fs/promises";
import zlib from "node:zlib";

function readUInt32LE(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function readUInt16LE(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function findEocd(buffer) {
  const sig = 0x06054b50;
  const minSize = 22;
  const maxSearch = Math.min(buffer.length, 0x10000 + minSize);
  for (let i = buffer.length - minSize; i >= buffer.length - maxSearch; i -= 1) {
    if (buffer.readUInt32LE(i) === sig) {
      return i;
    }
  }
  return -1;
}

function readZipEntry(buffer, entryName) {
  const eocdOffset = findEocd(buffer);
  if (eocdOffset < 0) {
    throw new Error("Invalid zip: EOCD not found");
  }
  const cdSize = readUInt32LE(buffer, eocdOffset + 12);
  const cdOffset = readUInt32LE(buffer, eocdOffset + 16);
  let offset = cdOffset;
  const cdSig = 0x02014b50;
  while (offset < cdOffset + cdSize) {
    if (buffer.readUInt32LE(offset) !== cdSig) {
      throw new Error("Invalid zip: central directory header not found");
    }
    const nameLen = readUInt16LE(buffer, offset + 28);
    const extraLen = readUInt16LE(buffer, offset + 30);
    const commentLen = readUInt16LE(buffer, offset + 32);
    const localHeaderOffset = readUInt32LE(buffer, offset + 42);
    const nameStart = offset + 46;
    const name = buffer.slice(nameStart, nameStart + nameLen).toString("utf8");
    if (name === entryName) {
      const localSig = 0x04034b50;
      if (buffer.readUInt32LE(localHeaderOffset) !== localSig) {
        throw new Error("Invalid zip: local file header not found");
      }
      const compression = readUInt16LE(buffer, localHeaderOffset + 8);
      const compSize = readUInt32LE(buffer, localHeaderOffset + 18);
      const localNameLen = readUInt16LE(buffer, localHeaderOffset + 26);
      const localExtraLen = readUInt16LE(buffer, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compData = buffer.slice(dataStart, dataStart + compSize);
      if (compression === 0) {
        return compData;
      }
      if (compression === 8) {
        return zlib.inflateRawSync(compData);
      }
      throw new Error(`Unsupported zip compression: ${compression}`);
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`Zip entry not found: ${entryName}`);
}

function columnIndexFromRef(ref) {
  let idx = 0;
  for (let i = 0; i < ref.length; i += 1) {
    const code = ref.charCodeAt(i);
    if (code < 65 || code > 90) break;
    idx = idx * 26 + (code - 64);
  }
  return idx;
}

export async function readXlsxSheetStats(filePath, sheetPath = "xl/worksheets/sheet1.xml") {
  const buffer = await fs.readFile(filePath);
  const xml = readZipEntry(buffer, sheetPath).toString("utf8");
  const rowRegex = /<row\b[^>]*>/g;
  const cellRegex = /<c\b[^>]*\br="([A-Z]+)(\d+)"/g;

  let rowCount = 0;
  let maxRow = 0;
  let maxCol = 0;
  let match;
  while ((match = rowRegex.exec(xml))) {
    rowCount += 1;
    const rowAttr = match[0].match(/\br="(\d+)"/);
    if (rowAttr) {
      const value = Number(rowAttr[1]);
      if (Number.isFinite(value) && value > maxRow) {
        maxRow = value;
      }
    }
  }
  while ((match = cellRegex.exec(xml))) {
    const colIdx = columnIndexFromRef(match[1]);
    const rowIdx = Number(match[2]);
    if (colIdx > maxCol) maxCol = colIdx;
    if (Number.isFinite(rowIdx) && rowIdx > maxRow) maxRow = rowIdx;
  }
  return { rowCount, maxRow, maxCol };
}

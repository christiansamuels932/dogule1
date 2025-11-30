const SLOT_MS = 30 * 60 * 1000;

export function computeEventLayout(events = [], gridStart, gridEnd) {
  const start = toDate(gridStart, "grid-start");
  const end = toDate(gridEnd, "grid-end");
  if (!(end > start)) {
    throw new Error("grid-end must be after grid-start");
  }

  const normalized = (Array.isArray(events) ? events : []).map((evt) =>
    normalizeEvent(evt, start, end)
  );

  const sorted = [...normalized].sort((a, b) => {
    if (a.start.getTime() !== b.start.getTime()) return a.start - b.start;
    if (a.end.getTime() !== b.end.getTime()) return a.end - b.end;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });

  const positioned = [];
  let clusterStartIdx = 0;
  let clusterMaxEnd = sorted.length ? sorted[0].end : null;

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (clusterMaxEnd && current.start < clusterMaxEnd) {
      clusterMaxEnd = maxDate(clusterMaxEnd, current.end);
    } else if (i > clusterStartIdx) {
      assignColumns(sorted.slice(clusterStartIdx, i), positioned);
      clusterStartIdx = i;
      clusterMaxEnd = current.end;
    }
  }

  if (sorted.length && clusterStartIdx < sorted.length) {
    assignColumns(sorted.slice(clusterStartIdx), positioned);
  }

  return positioned;
}

function assignColumns(clusterEvents, positioned) {
  const columns = [];
  const temp = [];
  clusterEvents.forEach((evt) => {
    let colIndex = columns.findIndex((endTime) => endTime <= evt.start.getTime());
    if (colIndex === -1) {
      colIndex = columns.length;
      columns.push(evt.end.getTime());
    } else {
      columns[colIndex] = evt.end.getTime();
    }
    temp.push({
      ...evt,
      column: colIndex,
    });
  });
  const columnCount = Math.max(columns.length, 1);
  temp.forEach((evt) => {
    positioned.push({ ...evt, columnCount });
  });
}

function normalizeEvent(evt, gridStart, gridEnd) {
  const id = evt?.id ?? "";
  const title = evt?.title ?? "";
  const start = toDate(evt?.start, "event-start");
  const end = toDate(evt?.end, "event-end");

  let clampedStart = start < gridStart ? gridStart : start;
  let clampedEnd = end > gridEnd ? gridEnd : end;

  if (clampedEnd <= clampedStart) {
    clampedEnd = new Date(clampedStart.getTime() + SLOT_MS);
  }

  const rowStart = Math.floor((clampedStart - gridStart) / SLOT_MS);
  const rowEndRaw = Math.ceil((clampedEnd - gridStart) / SLOT_MS);
  const rowEnd = Math.max(rowStart + 1, rowEndRaw);

  return {
    id,
    title,
    start: clampedStart,
    end: clampedEnd,
    rowStart,
    rowEnd,
  };
}

function toDate(value, label) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  throw new Error(`Invalid ${label}`);
}

function maxDate(a, b) {
  return a > b ? a : b;
}

// ===== Column Types =====
export type ColumnType = "text" | "number";

export type Column = {
  id: string;
  label: string;
  type: ColumnType;
  width?: number;
};

// ===== Mock Columns =====
export const columns: Column[] = [
  { id: "name",   label: "Name",   type: "text",   width: 200 },
  { id: "status", label: "Status", type: "text",   width: 150 },
  { id: "owner",  label: "Owner",  type: "text",   width: 150 },
];

// ===== Row =====
export type Row = {
  id: string;
  order: number;
};

export type TableRow = {
  id: string;
  order: number;
} & Record<string, CellValue>;

// ===== Mock Rows =====
export const rows: TableRow[] = Array.from({ length: 0 }, (_, i) => ({
  id: `row-${i}`,
  order: i
}));

// ===== Cell =====
export type CellValue = string | number;
export type CellKey = `${string}:${string}`;
export type CellMap = Record<CellKey, CellValue>;

export type CellAddress = {
  rowId: string;
  columnId: string;
};

// -----------------------------
// Cell address utilities
// -----------------------------

export function toCellKey(address: CellAddress): CellKey {
  return `${address.rowId}:${address.columnId}`;
}

export function fromCellKey(key: CellKey): CellAddress {
  const parts = key.split(":");

  if (parts.length !== 2) {
    throw new Error(`Invalid CellKey format: ${key}`);
  }
  // Runtime guard ensures tuple safety
  const [rowId, columnId] = parts as [string, string];
  return { rowId, columnId };
}

// ===== Mock Cells =====
export const cells: CellMap = Object.fromEntries(
  rows.flatMap((row, i) => [
    [`${row.id}:name`,   `Task ${i + 1}`],
    [`${row.id}:status`, "In progress"],
    [`${row.id}:owner`,  "Alex"],
  ])
);

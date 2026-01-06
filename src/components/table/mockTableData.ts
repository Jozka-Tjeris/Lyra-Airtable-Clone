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
};

// ===== Mock Rows =====
export const rows: Row[] = Array.from({ length: 25 }, (_, i) => ({
  id: `row-${i}`,
}));

// ===== Cell =====
export type CellValue = string | number;
export type CellKey = `${string}:${string}`;
export type CellMap = Record<CellKey, CellValue>;

// ===== Mock Cells =====
export const cells: CellMap = Object.fromEntries(
  rows.flatMap((row, i) => [
    [`${row.id}:name`,   `Task ${i + 1}`],
    [`${row.id}:status`, "In progress"],
    [`${row.id}:owner`,  "Alex"],
  ])
);

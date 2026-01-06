"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { TableContext, type TableContextType } from "./TableContext";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";
import { TableCell } from "./TableCell";

import {
  columns as initialColumns,
  rows as initialRows,
  cells as initialCells,
  type Column,
  type Row,
  type CellMap,
  type CellValue,
  type CellKey
} from "./mockTableData";

// --------------------------------------------
// Helpers
// --------------------------------------------
type ActiveCell = {
  rowId: string;
  columnId: string;
} | null;

type TableRow = {
  id: string;
} & Record<string, CellValue>;


export function BaseTable() {
  // --------------------------------------------
  // Core grid state (UI-owned, not TanStack-owned)
  // --------------------------------------------
  const [rows] = useState<Row[]>(initialRows);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [cells, setCells] = useState<CellMap>(initialCells);

  // --------------------------------------------
  // Active cell + refs (for focus management)
  // --------------------------------------------
  const [activeCell, setActiveCell] = useState<ActiveCell>(null);
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // --------------------------------------------
  // Click outside → deactivate cell
  // --------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tableContainerRef.current &&
        !tableContainerRef.current.contains(e.target as Node)
      ) {
        setActiveCell(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --------------------------------------------
  // Focus active cell when it changes
  // --------------------------------------------
  useEffect(() => {
    if (!activeCell) return;

    const key = `${activeCell.rowId}:${activeCell.columnId}`;
    const el = cellRefs.current[key];
    if (el && document.activeElement !== el) {
      el.focus();
    }
  }, [activeCell]);

  const registerRef = useCallback(
    (id: string, el: HTMLDivElement | null) => {
      cellRefs.current[id] = el;
    },
    []
  );

  // --------------------------------------------
  // Cell updates (single source of truth)
  // --------------------------------------------
  const updateCell = useCallback(
    (rowId: string, columnId: string, value: CellValue) => {
      const key = `${rowId}:${columnId}`;
      setCells(prev => ({
        //Keep previous elements in to preserve structure
        ...prev,
        //Add new cell right after previous elements
        [key]: value,
      }));
    },
    []
  );

  // --------------------------------------------
  // Navigation helpers (index → id translation)
  // --------------------------------------------
  const moveToCell = useCallback(
    (rowIndex: number, colIndex: number) => {
      if (
        rowIndex < 0 ||
        rowIndex >= rows.length ||
        colIndex < 0 ||
        colIndex >= columns.length
      ) {
        return;
      }

      const rowId = rows[rowIndex]!.id;
      const columnId = columns[colIndex]!.id;
      setActiveCell({ rowId, columnId });
    },
    [rows, columns]
  );

  // --------------------------------------------
  // Derived table data for TanStack
  // --------------------------------------------
  const tableData = useMemo<TableRow[]>(() => {
    return rows.map(row => {
      const record: TableRow = { id: row.id };

      for (const col of columns) {
        record[col.id] = cells[`${row.id}:${col.id}`] ?? "";
      }

      return record;
    });
  }, [rows, columns, cells]);


  // --------------------------------------------
  // Column definitions (TanStack-facing)
  // --------------------------------------------
  const tableColumns: ColumnDef<TableRow>[] = useMemo(
    () =>
      columns.map((col, colIndex) => ({
        id: col.id,
        accessorKey: col.id,
        header: col.label,
        size: col.width ?? 150,
        minSize: 80,
        maxSize: 300,
        enableResizing: true,
        cell: info => {
          const rowIndex = info.row.index;
          const rowId = info.row.original.id;
          const columnId = col.id;
          const cellKey: CellKey = `${rowId}:${columnId}`;

          return (
            <TableCell
              cellId={cellKey}
              value={cells[cellKey] ?? ""}
              isActive={
                activeCell?.rowId === rowId &&
                activeCell?.columnId === columnId
              }
              onClick={() => setActiveCell({ rowId, columnId })}
              onChange={value => updateCell(rowId, columnId, value)}
              onMoveNext={() => moveToCell(rowIndex, colIndex + 1)}
              onMovePrev={() => moveToCell(rowIndex, colIndex - 1)}
              onMoveUp={() => moveToCell(rowIndex - 1, colIndex)}
              onMoveDown={() => moveToCell(rowIndex + 1, colIndex)}
              registerRef={registerRef}
            />
          );
        },
      })),
    [columns, cells, activeCell, moveToCell, updateCell, registerRef]
  );

  // --------------------------------------------
  // TanStack table instance
  // --------------------------------------------
  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    defaultColumn: { size: 150 },
  });

  // --------------------------------------------
  // Render
  // --------------------------------------------
  return (
    <TableContext.Provider value={{ table } as TableContextType<unknown>}>
      <div ref={tableContainerRef} className="w-full overflow-x-auto border">
        <div className="max-h-[calc(100vh-136px)] overflow-y-auto">
          <table className="border-collapse table-auto w-max">
            <TableHeader />
            <TableBody />
          </table>
        </div>
      </div>
    </TableContext.Provider>
  );
}

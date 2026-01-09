"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode, useRef, useEffect, type SetStateAction } from "react";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getSortedRowModel, type ColumnDef,
  type SortingState, type ColumnFiltersState, type VisibilityState, type ColumnSizingState,
 } from "@tanstack/react-table";
import type { Column, Row, CellMap, CellValue, TableRow, ColumnType } from "./tableTypes";
import { TableCell } from "../TableCell";
import { api as trpc } from "~/trpc/react";

export const TEST_TABLE_ID = "cmk5beznr0002gartzrg6rpy3";

export type TableProviderState = {
  rows: TableRow[];
  columns: Column[];
  cells: CellMap;
  activeCell: { rowId: string; columnId: string } | null;
  globalSearch: string;

  setActiveCell: (cell: { rowId: string; columnId: string } | null) => void;
  setGlobalSearch: (search: string) => void;
  registerRef: (id: string, el: HTMLDivElement | null) => void;
  updateCell: (rowId: string, columnId: string, value: CellValue) => void;

  handleAddRow: (orderNum: number, tableId: string) => void;
  handleDeleteRow: (rowId: string, tableId: string) => void;
  handleAddColumn: (orderNum: number, tableId: string, label: string, type: ColumnType) => void;
  handleDeleteColumn: (columnId: string, tableId: string) => void;
  handleRenameColumn: (columnId: string, newLabel: string, tableId: string) => void;

  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnSizing: ColumnSizingState;
  table: ReturnType<typeof useReactTable>;

  headerHeight: number;
  setHeaderHeight: (height: number) => void;
};

const TableContext = createContext<TableProviderState | undefined>(undefined);

export const useTableController = () => {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error("useTableController must be used within TableProvider");
  return ctx;
};

type TableProviderProps = {
  children: ReactNode;
  initialRows: Row[];
  initialColumns: Column[];
  initialCells: CellMap;
  initialGlobalSearch?: string;
};

export function TableProvider({ children, initialRows, initialColumns, initialCells, initialGlobalSearch = "" }: TableProviderProps) {
  const [rows, setRows] = useState<TableRow[]>(initialRows);
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [cells, setCells] = useState<CellMap>(initialCells);
  const [activeCell, setActiveCell] = useState<{ rowId: string; columnId: string } | null>(null);
  const [globalSearch, setGlobalSearch] = useState<string>(initialGlobalSearch);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const [headerHeight, setHeaderHeight] = useState(40);
  const structureMutationInFlightRef = useRef(0);

  const beginStructureMutation = () => {
    structureMutationInFlightRef.current += 1;
  };

  const endStructureMutation = () => {
    structureMutationInFlightRef.current -= 1;
  };

  // -----------------------
  // tRPC mutations
  // -----------------------
  const updateCellsMutation = trpc.table.updateCells.useMutation({
    // If mutation fails, rollback
    onError: (error) => {
      console.error("Failed to update cells:", error);
    },
  });

  const addRowMutation = trpc.table.addRow.useMutation({
    onSuccess: ({ row, optimisticId }) => {
      // 1. Replace row ID
      setRows(prev =>
        prev.map(r => r.id === optimisticId ? {...row, optimistic: false } : r)
      );

      // 2. Replace cell keys
      setCells(prev => {
        const next: CellMap = {};
        for (const [key, value] of Object.entries(prev)) {
          const [rId, colId] = key.split(":");
          const newRowId = rId === optimisticId ? row.id : rId;
          next[`${newRowId}:${colId}`] = value;
        }
        return next;
      });
    },
    onError: (error, { optimisticId }) => {
      console.error("Failed to add row:", error);
      setRows(prev => prev.filter(r => r.id !== optimisticId));
    },
  });

  const deleteRowMutation = trpc.table.deleteRow.useMutation({
    onError: (error) => {
      console.error("Failed to delete row:", error);
    },
  });

  const addColumnMutation = trpc.table.addColumn.useMutation({
    onSuccess: ({ column, optimisticId }) => {
      // 1. Replace column ID
      setColumns(prev => prev.map(c => c.id === optimisticId ? { id: column.id, label: column.name, 
        type: column.type as ColumnType, order: column.order, optimistic: false } : c));

      // 2. Replace column IDs inside cell keys
      setCells(prev => {
        const next: CellMap = {};
        for (const [key, value] of Object.entries(prev)) {
          const [rowId, colId] = key.split(":");
          const newColId = colId === optimisticId ? column.id : colId;
          next[`${rowId}:${newColId}`] = value;
        }
        return next;
      });
    },

    onError: (error, { optimisticId }) => {
      console.error("Failed to add column:", error);
      // rollback optimistic column
      setColumns(prev => prev.filter(c => c.id !== optimisticId));
      setCells(prev => {
        const next: CellMap = {};
        for (const [key, value] of Object.entries(prev)) {
          const [, colId] = key.split(":");
          if (colId !== optimisticId) next[key] = value;
        }
        return next;
      });
    },
  });


  const deleteColumnMutation = trpc.table.deleteColumn.useMutation({
    onError: (error) => {
      console.error("Failed to delete column:", error);
    },
  });

  const renameColumnMutation = trpc.table.renameColumn.useMutation({
    onError: (error) => {
      console.error("Failed to rename column:", error);
    },
  });

  // -----------------------
  // Cell refs for keyboard navigation
  // -----------------------
  const cellRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const registerRef = useCallback((id: string, el: HTMLDivElement | null) => {
    cellRefs.current[id] = el;
  }, []);

  // -----------------------
  // Batching for cell updates
  // -----------------------
  const pendingCellUpdatesRef = useRef<{ rowId: string; columnId: string; value: CellValue }[]>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Default debounce duration (ms)
  const DEFAULT_BATCH_DELAY = 500;

  // Flush pending updates to the server
  const flushCellUpdates = useCallback(() => {
    if (pendingCellUpdatesRef.current.length === 0) return;

    //Do NOT flush if structure mutation is active
    if (structureMutationInFlightRef.current > 0) {
      return;
    }

    // Capture pending updates
    const updatesToSend = [...pendingCellUpdatesRef.current];
    pendingCellUpdatesRef.current = [];

    // Call the batch mutation
    updateCellsMutation.mutate(updatesToSend);

    batchTimerRef.current = null;
  }, [updateCellsMutation]);

  // Debounced updateCell
  const updateCell = useCallback(
    (rowId: string, columnId: string, value: CellValue) => {
      const column = columns.find(col => col.id === columnId);
      if (!column) return;

      let newValue: string;
      if (column.type === "number") {
        const numericValue = Number(value);
        if (isNaN(numericValue)) return;
        newValue = numericValue.toString();
      } else {
        newValue = String(value);
      }

      const key = `${rowId}:${columnId}`;

      // Update local state immediately
      setCells(prev => ({ ...prev, [key]: newValue }));

      // Queue for batch update
      pendingCellUpdatesRef.current.push({ rowId, columnId, value: newValue });
      // Debounce sending
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      batchTimerRef.current = setTimeout(flushCellUpdates, DEFAULT_BATCH_DELAY); // 500ms debounce
    },
    [columns, flushCellUpdates]
  );

  // Flush remaining updates on unmount
  useEffect(() => {
    return () => {
      if (pendingCellUpdatesRef.current.length > 0) {
        flushCellUpdates();
      }
    };
  }, [flushCellUpdates]);

  // -----------------------
  // Row operations
  // -----------------------
  const handleDeleteRow = useCallback((rowId: string, tableId: string) => {
    beginStructureMutation();

    setRows(prev => prev.filter(r => r.id !== rowId));
    setCells(prev => {
      const updated: CellMap = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [rId] = key.split(":");
        if (rId !== rowId) updated[key] = value;
      });
      return updated;
    });

    // Remove pending updates for this row to prevent ghosts
    pendingCellUpdatesRef.current = pendingCellUpdatesRef.current.filter(u => u.rowId !== rowId);

    deleteRowMutation.mutate(
      { tableId, rowId },
      {
        onSettled: () => {
          endStructureMutation();
          flushCellUpdates();
        }
      }
    );
  }, [deleteRowMutation, endStructureMutation, flushCellUpdates]);

  const handleAddRow = useCallback((orderNum: number, tableId: string) => {
    beginStructureMutation();

    const optimisticId = `optimistic-row-${crypto.randomUUID()}`;
    const newRow: TableRow = { id: optimisticId, order: orderNum, optimistic: true };

    setRows(prev => [...prev, newRow]);
    setCells(prev => {
      const newCells = { ...prev };
      columns.forEach(col => {
        newCells[`${optimisticId}:${col.id}`] = "";
      });
      return newCells;
    });

    // Remove any pending cell updates for this new row (safety)
    pendingCellUpdatesRef.current = pendingCellUpdatesRef.current.filter(u => u.rowId !== optimisticId);

    addRowMutation.mutate(
      { tableId, orderNum, optimisticId },
      {
        onSettled: () => {
          endStructureMutation();
          flushCellUpdates();
        }
      }
    );
  }, [columns, addRowMutation, endStructureMutation, flushCellUpdates]);

  // -----------------------
  // Column operations
  // -----------------------
  const handleAddColumn = useCallback((orderNum: number, tableId: string, label: string, type: ColumnType) => {
    beginStructureMutation();

    const optimisticId = `optimistic-col-${crypto.randomUUID()}`;
    const newCol: Column = { id: optimisticId, label: label, order: orderNum, type: type, optimistic: true };
    setColumns(prev => [...prev, newCol]);

    // initialize cells for new column
    setCells(prev => {
      const newCells = { ...prev };
      rows.forEach(row => {
        newCells[`${row.id}:${optimisticId}`] = "";
      });
      return newCells;
    });

    // Remove pending updates for this column (safety)
    pendingCellUpdatesRef.current = pendingCellUpdatesRef.current.filter(u => u.columnId !== optimisticId);

    addColumnMutation.mutate(
      { tableId, label, orderNum, type, optimisticId },
      {
        onSettled: () => {
          endStructureMutation();
          flushCellUpdates();
        }
      }
    );
  }, [rows, addColumnMutation, endStructureMutation, flushCellUpdates]);

  const handleDeleteColumn = useCallback((columnId: string, tableId: string) => {
    beginStructureMutation();

    setColumns(prev => prev.filter(c => c.id !== columnId));
    setCells(prev => {
      const updated: CellMap = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [, colId] = key.split(":");
        if (colId !== columnId) updated[key] = value;
      });
      return updated;
    });

    // Remove pending updates for this column
    pendingCellUpdatesRef.current = pendingCellUpdatesRef.current.filter(u => u.columnId !== columnId);

    deleteColumnMutation.mutate(
      { tableId, columnId },
      {
        onSettled: () => {
          endStructureMutation();
          flushCellUpdates();
        }
      }
    );

  }, [deleteColumnMutation, endStructureMutation, flushCellUpdates]);

  const handleRenameColumn = useCallback((columnId: string, newLabel: string, tableId: string) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, label: newLabel } : c));
    renameColumnMutation.mutate({ tableId, columnId, newLabel });
  }, [renameColumnMutation]);

  // Focus active cell
  useEffect(() => {
    if (!activeCell) return;
    const key = `${activeCell.rowId}:${activeCell.columnId}`;
    const el = cellRefs.current[key];
    const isTyping = document.activeElement?.tagName === 'INPUT';
    if (el && !isTyping && document.activeElement !== el) {
      el.focus();
    }
  }, [activeCell]);

  const handleSortingChange = useCallback((updaterOrValue: SetStateAction<SortingState>) => {
    setSorting(updaterOrValue);
    // This force-syncs the state update
  }, []);

  // -----------------------
  // Table instance
  // -----------------------

  // Sort rows by order
  const visibleRows = useMemo(() => [...rows].sort((a, b) => a.order - b.order), [rows]);

  // Filter + search
  const tableData = useMemo(() => {
    const search = globalSearch.trim().toLowerCase();
    return visibleRows
      .filter(row => {
        if (!search) return true;
        return columns.some(col => {
          const value = cells[`${row.id}:${col.id}`];
          return value != null && String(value).toLowerCase().includes(search);
        });
      })
      .map((row, idx) => {
        const record: Record<string, CellValue> = { id: row.id, order: idx };
        columns.forEach(col => {
          record[col.id] = cells[`${row.id}:${col.id}`] ?? "";
        });
        return record;
      });
  }, [visibleRows, columns, cells, globalSearch]);

  // Column defs for TanStack
  const tableColumns: ColumnDef<unknown>[] = useMemo(() => {
    return columns.map((col) => ({
      id: col.id,
      accessorKey: col.id,
      header: col.label,
      enableColumnFilter: true,
      filterFn: col.type === "number" ? "inNumberRange" : "includesString",
      size: col.width ?? 150,
      minSize: 80,
      maxSize: 300,
      enableResizing: true,
      cell: info => {
        const rowElem = info.row.original as Row;
        const rowId = rowElem.id;
        const columnId = col.id;
        const cellKey = `${rowId}:${columnId}`;

        return (
          <TableCell
            cellId={cellKey}
            value={cells[cellKey] ?? ""}
            rowId={rowId}
            columnId={columnId}
            columnType={col.type}
            onClick={() => setActiveCell({ rowId, columnId })}
            onChange={value => updateCell(rowId, columnId, value)}
            registerRef={registerRef}
          />
        );
      }
    }));
  }, [columns, cells, updateCell, registerRef]);

  // TanStack table instance
  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnSizing,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    columnResizeMode: "onChange",
    defaultColumn: { size: 150 },
  });

  const contextValue = useMemo(() => ({
    rows,
    columns,
    cells,
    activeCell,
    globalSearch,
    setActiveCell,
    setGlobalSearch,
    registerRef,
    updateCell,
    handleAddRow,
    handleDeleteRow,
    handleAddColumn,
    handleDeleteColumn,
    handleRenameColumn,
    table,
    sorting,
    columnFilters,
    columnSizing,
    headerHeight,
    setHeaderHeight
  }), [rows, columns, cells, activeCell, globalSearch, columnFilters, columnSizing, table, sorting, headerHeight,
    handleAddColumn, handleAddRow, handleDeleteColumn, handleDeleteRow, handleRenameColumn, registerRef, updateCell]);

  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  );
}

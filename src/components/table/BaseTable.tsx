"use client";

import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from "@tanstack/react-table";
import { TableContext } from "./TableContext";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";

import { columns as columnMeta, rows, type Row } from "./mockTableData";

export function BaseTable() {
  const tableColumns: ColumnDef<Row>[] = columnMeta.map(col => ({
    accessorKey: col.id,
    header: col.label,
    cell: info => info.getValue(),
    enableResizing: true,
    size: 150,
    minSize: 80,
    maxSize: 300,
  }));

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    defaultColumn: { size: 150 },
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <TableContext.Provider value={{ table }}>
      <div className="w-full overflow-x-auto border">
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
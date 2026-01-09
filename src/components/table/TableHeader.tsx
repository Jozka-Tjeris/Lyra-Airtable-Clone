"use client";

import { useCallback } from "react";
import { flexRender } from "@tanstack/react-table";
import { TEST_TABLE_ID, useTableController } from "@/components/table/controller/TableProvider";
import { type ColumnType, COLUMN_CONFIG } from "./controller/tableTypes";

export function TableHeader() {
  const { table, columns, handleAddColumn, handleDeleteColumn, handleRenameColumn, headerHeight, setHeaderHeight } = useTableController();
  const headerGroups = table.getHeaderGroups();

  const startVerticalResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = headerHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      setHeaderHeight(Math.max(32, startHeight + delta));
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [headerHeight, setHeaderHeight]);

  const onAddColumnClick = useCallback(() => {
    const name = prompt("Enter column name:", `Column ${columns.length + 1}`);
    if (!name) return;
    let typeInput = prompt("Enter column type (text, number) [default is text]:", "text");
    if (typeInput === null) return;
    const type: ColumnType = typeInput.toLowerCase().trim() === "number" ? "number" : "text";
    handleAddColumn(columns.length + 1, TEST_TABLE_ID, name, type);
  }, []);

  const hasColumns = headerGroups.some(group => group.headers.length > 0);

  return (
    <thead className="border-b bg-gray-50 uppercase text-[11px] tracking-wider text-gray-500">
      {hasColumns ? (
        headerGroups.map(group => (
          <tr key={group.id} style={{ height: headerHeight }}>
            {group.headers.map(header => {
              const columnId = header.column.id;
              const isSorted = header.column.getIsSorted();
              const isFiltered = header.column.getIsFiltered();
              
              // Correctly typed metadata extraction
              const meta = header.column.columnDef.meta as { columnType?: ColumnType };
              const type = meta?.columnType || "text";
              const config = COLUMN_CONFIG[type];
              const isNumber = type === "number";

              return (
                <th
                  key={header.id}
                  style={{ width: header.getSize(), height: headerHeight, position: 'relative' }}
                  className={`px-3 py-2 font-medium select-none border-r last:border-r-0 transition-colors ${
                    isSorted ? "bg-blue-50/50" : ""
                  }`}
                  onDoubleClick={() => {
                    const newLabel = prompt("Enter new column name:");
                    if (newLabel) handleRenameColumn(columnId, newLabel, TEST_TABLE_ID);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (window.confirm(`Delete column?`)) handleDeleteColumn(columnId, TEST_TABLE_ID);
                  }}
                >
                  {!header.isPlaceholder && (
                    <div className={`flex items-center w-full h-full gap-2 flex-row`}>
                      
                      {/* 1. Icon & Label Wrapper */}
                      <div 
                        className={`flex items-center gap-1.5 overflow-hidden cursor-pointer hover:text-gray-900 transition-colors flex-grow flex-row }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="text-gray-400 font-mono text-[10px] w-4 flex-shrink-0 text-center">
                          {config.icon}
                        </span>
                        <span className="truncate">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {isSorted && (
                          <span className="text-blue-500 font-bold flex-shrink-0">
                            {isSorted === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>

                      {/* 2. Filter Button (Always on the "inside" of the cell) */}
                      <button
                        className={`text-[10px] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isFiltered ? "opacity-100 text-blue-600" : "text-gray-300"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          header.column.setFilterValue(isFiltered ? undefined : "1");
                        }}
                      >
                        {isFiltered ? "●" : "▾"}
                      </button>
                    </div>
                  )}

                  {/* Resizers */}
                  <div onMouseDown={header.getResizeHandler()} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 z-20" />
                  <div onMouseDown={startVerticalResize} className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-400 z-20" />
                </th>
              );
            })}

            {/* Final 'Add Column' Header Cell */}
            <th className="bg-gray-50 border-l p-0 text-center" style={{ width: 50 }}>
              <button
                onClick={onAddColumnClick}
                className="inline-flex items-center justify-center w-6 h-6 bg-green-500 text-white rounded hover:bg-green-600 transition shadow-sm text-lg leading-none"
              >
                +
              </button>
            </th>
          </tr>
        ))
      ) : null}
    </thead>
  );
}
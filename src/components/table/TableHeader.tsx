import { flexRender } from "@tanstack/react-table";
import { useTableContext } from "./TableContext";
import { useState, useCallback } from "react";
import type { TableRow } from "./mockTableData";

export function TableHeader() {
  const { 
    table, 
    handleAddColumn, 
    handleDeleteColumn, 
    handleRenameColumn 
  } = useTableContext<TableRow>();

  // Columns currently sorted (for blue highlight)
  const sortedColumnIds = table.getState().sorting.map(s => s.id);

  // Single height for all header rows
  const [headerHeight, setHeaderHeight] = useState(40); // default 40px

  // -----------------------------
  // Vertical resize
  // -----------------------------
  const startVerticalResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = headerHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      setHeaderHeight(Math.max(32, startHeight + delta)); // min height 32px
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [headerHeight]);

  // -----------------------------
  // Column events
  // -----------------------------
  const handleHeaderDoubleClick = useCallback((columnId: string) => {
    const newLabel = prompt("Enter new column name:");
    if (newLabel && handleRenameColumn) handleRenameColumn(columnId, newLabel);
  }, [handleRenameColumn]);

  const handleHeaderRightClick = useCallback(
    (e: React.MouseEvent, columnId: string, label: string) => {
      e.preventDefault();

      const confirmed = window.confirm(
        `Delete column "${label}"?\n\nThis will remove all its cell values.`
      );

      if (confirmed) {
        handleDeleteColumn(columnId);
      }
    },
    [handleDeleteColumn]
  );

  //Checks for empty columns
  const headerGroups = table.getHeaderGroups();
  const hasColumns = headerGroups.some(group => group.headers.length > 0);

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <thead className="border-b bg-gray-50">
      {hasColumns ? (
        headerGroups.map(headerGroup => (
          <tr key={headerGroup.id} style={{ height: headerHeight }}>
            {headerGroup.headers.map(header => {
              const isActive = sortedColumnIds.includes(header.column.id);
              const columnId = header.column.id;

              return (
                <th
                  key={header.id} 
                  style={{ width: header.getSize(), tableLayout: "fixed", height: headerHeight }}
                  className={`relative px-4 py-2 text-left font-semibold select-none ${
                    isActive ? "bg-blue-100" : ""
                  }`}
                  onDoubleClick={() => handleHeaderDoubleClick(columnId)}
                  onContextMenu={(e) => handleHeaderRightClick(e, columnId, String(header.column.columnDef.header))}
                >
                  {!header.isPlaceholder && (
                    <>
                      {/* Header text top-left */}
                      <div
                        className="absolute top-1 left-1 pr-6"
                        style={{ lineHeight: 1.2 }}
                      >
                        <span
                          className="cursor-pointer hover:underline flex items-center"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc"
                            ? " ↑"
                            : header.column.getIsSorted() === "desc"
                            ? " ↓"
                            : ""}
                        </span>
                      </div>

                      {/* Filter button top-right */}
                      <button
                        className="absolute top-1 right-2 text-gray-400 hover:text-gray-700"
                        onClick={() => {
                          // Check if this column is already filtered
                          const existingFilter = table.getState().columnFilters.find(f => f.id === columnId);

                          if (existingFilter) {
                            // Second click, remove the filter
                            table.setColumnFilters(
                              table.getState().columnFilters.filter(f => f.id !== columnId)
                            );
                            console.log(`Cleared filter for column: ${columnId}`);
                          } else {
                            // First click, apply the filter
                            table.setColumnFilters([
                              ...table.getState().columnFilters,
                              { id: columnId, value: "Not" },
                            ]);
                            console.log(`Applied filter for column: ${columnId}`);
                          }
                        }}
                      >
                        ⏺
                      </button>

                      {/* Horizontal resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-[1px] cursor-col-resize bg-gray-300 hover:bg-gray-500 z-10"
                        />
                      )}

                      {/* Vertical resize handle */}
                      <div
                        onMouseDown={startVerticalResize}
                        className="absolute bottom-0 left-0 w-full h-[1px] cursor-row-resize bg-gray-300 hover:bg-gray-500 z-10"
                      />
                    </>
                  )}
                </th>
              );
            })}

            {/* + Button for adding new column */}
            <th
              style={{ height: headerHeight, width: 50, minWidth: 50 }}
              className="relative border-l bg-gray-50 flex items-center justify-center"
            >
              <button
                onClick={handleAddColumn}
                className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm"
              >
                +
              </button>
            </th>
          </tr>
        )) 
      ) : (
        <tr style={{ height: headerHeight }}>
          <th
            style={{ height: headerHeight, width: 50, minWidth: 50 }}
            className="relative border-l bg-gray-50 flex items-center justify-center"
          >
            <button
              onClick={handleAddColumn}
              className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm"
            >
              +
            </button>
          </th>
          <th colSpan={1} className="px-4 py-2 text-center text-gray-500">
            No columns defined
          </th>
        </tr>
      )
    }
    </thead>
  );
}

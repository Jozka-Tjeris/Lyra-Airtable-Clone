import { flexRender } from "@tanstack/react-table";
import { useTableContext } from "./TableContext";
import type { Row } from "./mockTableData";

export function TableHeader() {
  const { table } = useTableContext<Row>();

  // Columns currently sorted (for blue highlight)
  const sortedColumnIds = table.getState().sorting.map(s => s.id);

  return (
    <thead className="border-b bg-gray-50">
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => {
            const isActive = sortedColumnIds.includes(header.column.id);

            return (
              <th
                key={header.id}
                style={{ width: header.getSize(), tableLayout: 'fixed' }} // column width
                className={`px-4 py-2 text-left font-semibold select-none relative
                  ${isActive ? "bg-blue-100" : ""}`}
              >
                {header.isPlaceholder ? null : (
                  <div className="flex items-center justify-between space-x-2 h-full">
                    {/* Column header text & sort toggle */}
                    <span
                      className="cursor-pointer hover:underline flex items-center"
                      onClick={() => {
                        header.column.getToggleSortingHandler()?.("");
                        console.log("Sort requested:", header.column.id);
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {/* Sort indicator */}
                      {header.column.getIsSorted() === "asc"
                        ? " ↑"
                        : header.column.getIsSorted() === "desc"
                        ? " ↓"
                        : ""}
                    </span>

                    {/* Filter button stub */}
                    <button
                      className="text-gray-400 hover:text-gray-700"
                      onClick={() =>
                        console.log("Filter clicked for:", header.column.id)
                      }
                    >
                      ⏺
                    </button>

                    {/* Resize handle */}
                    {header.column.getCanResize() && (
                      <div
                        {...{
                          onMouseDown: header.getResizeHandler(),
                          onTouchStart: header.getResizeHandler(),
                          className:
                            "absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-300 hover:bg-gray-500",
                        }}
                      />
                    )}
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}

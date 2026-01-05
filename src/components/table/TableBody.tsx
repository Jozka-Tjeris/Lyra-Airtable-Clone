import { flexRender } from "@tanstack/react-table";
import { useTableContext } from "./TableContext";
import type { Row } from "./mockTableData";

export function TableBody() {
  const { table } = useTableContext<Row>();

  return (
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id} className="border-b last:border-0">
          {row.getVisibleCells().map(cell => (
            <td key={cell.id} className="px-4 py-2">
              {flexRender(
                cell.column.columnDef.cell,
                cell.getContext()
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

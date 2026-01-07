"use client";

import { useTableController } from "@/components/table/controller/TableProvider";
import { TableHeader } from "./TableHeader";
import { TableBody } from "./TableBody";

export function BaseTable() {
  const { sorting } = useTableController();

  return (
    /* The parent (MainContent) handles the vertical scroll.
       This div only handles the horizontal scroll for when 
       the table is wider than the screen.
    */
    <div className="w-max overflow-x-auto">
      <table 
        className="table-fixed border-collapse w-max min-w-full" 
        style={{ width: "max-content" }}
      >
        {/* We keep the key on sorting so the header re-renders instantly */}
        <TableHeader key={JSON.stringify(sorting)}/>
        <TableBody />
      </table>
    </div>
  );
}
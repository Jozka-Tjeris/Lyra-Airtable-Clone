"use client";

import { createContext, useContext } from "react";
import { type Table } from "@tanstack/react-table";
import type { Row } from "./mockTableData";

type TableContextType<T> = {
  table: Table<T>;
};

export const TableContext = createContext<TableContextType<Row> | null>(null);

export function useTableContext<T>() {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error("useTableContext must be used inside TableContext.Provider");
  }
  return context as TableContextType<Row>;
}

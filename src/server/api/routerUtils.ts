import { type CellValue } from "~/components/table/controller/tableTypes";
import type { Prisma } from "~/generated/client";
import { TRPCError } from "@trpc/server";

// Utility to convert cell array to key-value map
export function normalizeCells(cells: { rowId: string; columnId: string; value: CellValue | null }[]) {
  const map: Record<string, CellValue | null> = {};
  for (const cell of cells) {
    const key = `${cell.rowId}:${cell.columnId}`;
    map[key] = cell.value;
  }
  return map;
}

export async function withTableLock<T>(
  tx: Prisma.TransactionClient,
  tableId: string,
  fn: () => Promise<T>
): Promise<T> {
  await tx.$executeRaw`
    SELECT 1 FROM "Table"
    WHERE id = ${tableId}
    FOR UPDATE
  `;

  return fn();
}

export async function assertTableAccess(
  ctx: any,
  tableId: string
) {
  const table = await ctx.db.table.findFirst({
    where: {
      id: tableId,
      base: { ownerId: ctx.session.user.id },
    },
    select: { id: true },
  });

  if (!table) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  return table;
}
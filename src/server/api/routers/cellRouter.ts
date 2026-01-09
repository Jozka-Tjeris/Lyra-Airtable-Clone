import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { assertTableAccess } from "../routerUtils";

export const cellRouter = createTRPCRouter({
  updateCell: protectedProcedure
    .input(z.object({
      rowId: z.string(),
      columnId: z.string(),
      value: z.union([z.string(), z.number()]),
    }))
    .mutation(async ({ ctx, input }) => {
      const column = await ctx.db.column.findUnique({ where: { id: input.columnId } });
      if (!column) throw new TRPCError({ code: "NOT_FOUND", message: "Column not found" });

      if (column.columnType === "number") {
        const numericValue = Number(input.value);
        if (isNaN(numericValue)) throw new TRPCError({ code: "BAD_REQUEST", message: "Value must be a number" });
        input.value = numericValue.toString();
      } else if (typeof input.value === "number") {
        input.value = input.value.toString();
      }

      return ctx.db.cell.upsert({
        where: { rowId_columnId: { rowId: input.rowId, columnId: input.columnId } },
        update: { value: input.value },
        create: { rowId: input.rowId, columnId: input.columnId, value: input.value },
      });
    }),

  updateCells: protectedProcedure
    .input(z.array(z.object({
      rowId: z.string(),
      columnId: z.string(),
      value: z.union([z.string(), z.number()]),
    })))
    .mutation(async ({ ctx, input }) => {
      if (input.length === 0) return [];
      //Get all relevant columns in a single query
      const columnIds = Array.from(new Set(input.map(u => u.columnId)));
      const columns = await ctx.db.column.findMany({ where: { id: { in: columnIds } } });

      //Build a map for quick lookup
      const columnMap = new Map(columns.map(c => [c.id, c.columnType]));

      //Get all rows in a single query
      const rows = await ctx.db.row.findMany();
      const rowSet = new Set(rows.map(r => r.id));

      console.log(rowSet);

      // Build PrismaPromises array
      const updates: ReturnType<typeof ctx.db.cell.upsert>[] = [];
      for (const { rowId, columnId, value } of input) {
        console.log(rowId)
        if (!rowSet.has(rowId)){
          console.error("No ROW");
          continue;
        }; 
        const columnType = columnMap.get(columnId);
        if (!columnType){
          console.error("No COLTYPE");
          continue;
        };

        let newValue: string;
        if (columnType === "number") {
          const numericValue = Number(value);
          if (isNaN(numericValue)) continue;
          newValue = numericValue.toString();
        } else {
          newValue = String(value);
        }

        //Push the list of PrismaPromises, don't await
        updates.push(
          ctx.db.cell.upsert({
            where: { rowId_columnId: { rowId, columnId } },
            update: { value: newValue },
            create: { rowId, columnId, value: newValue },
          })
        );
      }

      // Only run transaction if there are valid updates
      if (updates.length > 0) {
        await ctx.db.$transaction(updates);
      }

      return { updatedCount: updates.length };
    }),
});

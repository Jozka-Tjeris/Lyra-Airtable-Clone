import { postRouter } from "~/server/api/routers/post";
import { tableRouter } from "./routers/tableRouter";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { baseRouter } from "./routers/baseRouter";
import { rowRouter } from "./routers/rowRouter";
import { columnRouter } from "./routers/columnRouter";
import { cellRouter } from "./routers/cellRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  table: tableRouter,
  base: baseRouter,
  row: rowRouter,
  column: columnRouter,
  cell: cellRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

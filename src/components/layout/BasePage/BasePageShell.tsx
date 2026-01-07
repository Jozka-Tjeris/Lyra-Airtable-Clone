import { LeftBar } from "./LeftBar";
import { TopBar } from "./TopBar";
import { TableSelectionBar } from "./TableSelectionBar";
import { GridViewBar } from "./GridViewBar";
import { ViewSelectorBar } from "./ViewSelectorBar";
import { MainContent } from "./MainContent";
import { TableProvider } from "~/components/table/controller/TableProvider";
import { columns as initialColumns, rows as initialRows, cells as initialCells } from "~/components/table/model/mockData";

export function BasePageShell() {
  return <TableProvider
      initialRows={initialRows}
      initialColumns={initialColumns}
      initialCells={initialCells}
    >
      <div className="flex flex-row h-screen w-full overflow-hidden">
      <LeftBar />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <TopBar />
        <TableSelectionBar />
        <GridViewBar />
        <div className="flex flex-row flex-1 min-w-0 min-h-0">
          <ViewSelectorBar />
          <main className="flex-1 min-w-0 min-h-0">
              <MainContent/>
            </main>
        </div>
      </div>
    </div>
  </TableProvider>
}

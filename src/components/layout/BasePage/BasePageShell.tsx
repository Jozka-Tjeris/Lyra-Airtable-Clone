import { LeftBar } from "./LeftBar";
import { TopBar } from "./TopBar";
import { TableSelectionBar } from "./TableSelectionBar";
import { GridViewBar } from "./GridVewBar";
import { ViewSelectorBar } from "./ViewSelectorBar";
import { MainContent } from "./MainContent";

export function BasePageShell() {
  return <div className="flex flex-row h-screen w-full overflow-hidden">
    <LeftBar />
    <div className="flex flex-col flex-1 min-w-0">
      <TopBar />
      <TableSelectionBar />
      <GridViewBar />
      <div className="flex flex-row flex-1 min-w-0">
        <ViewSelectorBar />
        <main className="flex-1 min-w-0 overflow-auto">
            <MainContent />
          </main>
      </div>
    </div>
  </div>
}

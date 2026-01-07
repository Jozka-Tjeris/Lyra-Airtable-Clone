"use client";

import { LeftBar } from "./LeftBar";
import { TopBar } from "./TopBar";
import { TableSelectionBar } from "./TableSelectionBar";
import { GridViewBar } from "./GridViewBar";
import { ViewSelectorBar } from "./ViewSelectorBar";
import { MainContent } from "./MainContent";
import { useState } from "react";

export function BasePageShell() {
  const [globalSearch, setGlobalSearch] = useState("");

  return <div className="flex flex-row h-screen w-full overflow-hidden">
    <LeftBar />
    <div className="flex flex-col flex-1 min-w-0">
      <TopBar />
      <TableSelectionBar />
      <GridViewBar globalSearch={globalSearch} setGlobalSearch={setGlobalSearch} />
      <div className="flex flex-row flex-1 min-w-0">
        <ViewSelectorBar />
        <main className="flex-1 min-w-0 overflow-auto">
            <MainContent globalSearch={globalSearch} />
          </main>
      </div>
    </div>
  </div>
}

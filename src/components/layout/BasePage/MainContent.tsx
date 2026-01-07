import { BaseTable } from "~/components/table/BaseTable";

export function MainContent({ globalSearch }: { globalSearch: string }) {
  return (
    <div className="flex flex-auto">
      <BaseTable globalSearch={globalSearch} />
    </div>
  );
}

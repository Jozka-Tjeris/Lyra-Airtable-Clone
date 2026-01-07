type GridViewBarProps = {
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
};

export function GridViewBar({ globalSearch, setGlobalSearch }: GridViewBarProps){
    return <div className="h-12 border-b border-gray-750 bg-gray-50">
        <div className="flex items-center justify-between px-3 py-2 border-b bg-white">
            <div className="flex items-center gap-2">
                {/* Filters / Sort buttons later */}
            </div>

            <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search"
                className="
                w-56 px-3 py-1
                border rounded
                text-sm
                focus:outline-none
                focus:ring-2 focus:ring-blue-500
                "
            />
        </div>
    </div>
}
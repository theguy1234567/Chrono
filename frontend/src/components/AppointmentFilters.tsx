type FiltersProps = {
  dateValue: string;
  statusValue: "all" | "scheduled" | "completed" | "cancelled";
  onDateChange: (value: string) => void;
  onStatusChange: (
    value: "all" | "scheduled" | "completed" | "cancelled",
  ) => void;
};

export default function AppointmentFilters({
  dateValue,
  statusValue,
  onDateChange,
  onStatusChange,
}: FiltersProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1 text-sm text-slate-300">
          <span className="mb-2 block font-medium">Filter by date</span>
          <input
            type="date"
            value={dateValue}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
          />
        </label>

        <label className="flex-1 text-sm text-slate-300 md:max-w-xs">
          <span className="mb-2 block font-medium">Filter by status</span>
          <select
            value={statusValue}
            onChange={(event) =>
              onStatusChange(
                event.target.value as
                  | "all"
                  | "scheduled"
                  | "completed"
                  | "cancelled",
              )
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
          >
            <option value="all">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => {
            onDateChange("");
            onStatusChange("all");
          }}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

type HeaderProps = {
  stats: {
    scheduled: number;
    completed: number;
    cancelled: number;
    total: number;
  };
  onCreate: () => void;
};

export default function Header({ stats, onCreate }: HeaderProps) {
  return (
    <header className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-glow backdrop-blur-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">
            Appointment Board
          </p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Team scheduling, simplified
          </h1>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          + New Appointment
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Total
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-200">
            Scheduled
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {stats.scheduled}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-blue-200">
            Completed
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {stats.completed}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-rose-200">
            Cancelled
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {stats.cancelled}
          </p>
        </div>
      </div>
    </header>
  );
}

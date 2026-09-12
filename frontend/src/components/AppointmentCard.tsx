import type { Appointment } from "../types/appointment";

type AppointmentCardProps = {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onComplete: (id: number) => void;
  onCancel: (id: number) => void;
};

const statusStyles: Record<Appointment["status"], string> = {
  scheduled: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  completed: "border-blue-500/30 bg-blue-500/10 text-blue-200",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-200",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AppointmentCard({
  appointment,
  onEdit,
  onComplete,
  onCancel,
}: AppointmentCardProps) {
  const isScheduled = appointment.status === "scheduled";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg shadow-slate-950/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {appointment.title}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[appointment.status]}`}
            >
              {appointment.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {appointment.description || "No description provided."}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-slate-300">
        <p>
          <span className="font-medium text-slate-200">Start:</span>{" "}
          {formatDateTime(appointment.start_time)}
        </p>
        <p>
          <span className="font-medium text-slate-200">End:</span>{" "}
          {formatDateTime(appointment.end_time)}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onEdit(appointment)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 transition hover:border-slate-500"
        >
          Edit
        </button>

        {isScheduled && (
          <>
            <button
              type="button"
              onClick={() => onComplete(appointment.id)}
              className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
            >
              Complete
            </button>
            <button
              type="button"
              onClick={() => onCancel(appointment.id)}
              className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </article>
  );
}

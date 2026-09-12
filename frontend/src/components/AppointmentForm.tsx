import { useEffect, useState } from "react";

export type AppointmentDraft = {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
};

type AppointmentFormProps = {
  mode: "create" | "edit";
  initialData: AppointmentDraft;
  isLoading: boolean;
  onSubmit: (draft: AppointmentDraft) => void;
  onCancel: () => void;
};

export default function AppointmentForm({
  mode,
  initialData,
  isLoading,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const [draft, setDraft] = useState<AppointmentDraft>(initialData);

  useEffect(() => {
    setDraft(initialData); // eslint-disable-line react-hooks/set-state-in-effect
  }, [initialData]);

  const updateField = (field: keyof AppointmentDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim()) {
      return;
    }

    onSubmit({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-white">
            {mode === "create" ? "Create appointment" : "Edit appointment"}
          </h3>
          <p className="text-sm text-slate-400">
            Keep your schedule organized and conflict-free.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2 text-sm text-slate-300">
          <span className="mb-2 block font-medium">Title</span>
          <input
            required
            type="text"
            value={draft.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Weekly team sync"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
          />
        </label>

        <label className="md:col-span-2 text-sm text-slate-300">
          <span className="mb-2 block font-medium">Description</span>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Project updates, blockers, and follow-ups"
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
          />
        </label>

        <label className="text-sm text-slate-300">
          <span className="mb-2 block font-medium">Date</span>
          <input
            required
            type="date"
            value={draft.date}
            onChange={(event) => updateField("date", event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            <span className="mb-2 block font-medium">Start time</span>
            <input
              required
              type="time"
              value={draft.startTime}
              onChange={(event) => updateField("startTime", event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
            />
          </label>

          <label className="text-sm text-slate-300">
            <span className="mb-2 block font-medium">End time</span>
            <input
              required
              type="time"
              value={draft.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-slate-100 outline-none transition focus:border-indigo-400"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Create appointment"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

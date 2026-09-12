import { useEffect, useMemo, useState } from "react";
import { api } from "./services/api";
import type { Appointment as ApiAppointment } from "./types/appointment";

type View = "overview" | "appointments" | "schedules" | "calendar" | "archive";
type Status =
  | "scheduled"
  | "active"
  | "confirmed"
  | "completed"
  | "pending"
  | "cancelled"
  | "archived";
type CalendarMode = "month" | "week" | "day";
type Appointment = {
  id: string;
  backendId?: number;
  title: string;
  clientName: string;
  caseFile: string;
  date: string;
  startTime: string;
  duration: number;
  venue: string;
  location: string;
  status: Status;
  notes: string;
  createdAt: string;
};
type Draft = Omit<Appointment, "id" | "createdAt" | "backendId">;
type Schedule = Record<
  string,
  { enabled: boolean; start: string; end: string }
>;

const storageKey = "chrono-appointments-v2";
const scheduleKey = "chrono-schedule-v1";
const now = new Date();
const pad = (value: number) => String(value).padStart(2, "0");
const dateValue = (date: Date) =>
  String(date.getFullYear()) +
  "-" +
  pad(date.getMonth() + 1) +
  "-" +
  pad(date.getDate());
const currentDate = dateValue(now);
const displayDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const longDate = (value: string) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
const minutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};
const timeValue = (value: number) =>
  `${pad(Math.floor(value / 60) % 24)}:${pad(value % 60)}`;

const demoAppointments: Appointment[] = (
  [
    [
      "Marcus Sterling",
      "Architectural Review",
      "Executive Boardroom A",
      "completed",
      "09:00",
      45,
    ],
    [
      "Dr. Elena Vance",
      "Clinical Systems Diagnostic",
      "Studio Room 048",
      "active",
      "10:30",
      60,
    ],
    [
      "Aria Montgomery",
      "Follow-up Protocol",
      "Suite 201",
      "confirmed",
      "13:15",
      30,
    ],
    [
      "Kaelen Voss",
      "Research Review",
      "Virtual Hub Direct",
      "confirmed",
      "15:00",
      45,
    ],
    [
      "Soren K. Lind",
      "Quarterly Retrospective",
      "Direct Telephony",
      "pending",
      "16:30",
      30,
    ],
  ] as Array<[string, string, string, Status, string, number]>
).map(([clientName, caseFile, venue, status, startTime, duration], index) => ({
  id: `demo-${index}`,
  title: caseFile,
  clientName,
  caseFile,
  date: currentDate,
  startTime,
  duration,
  venue,
  location: venue,
  status,
  notes: "Prepared for the upcoming appointment.",
  createdAt: now.toISOString(),
}));

const defaultSchedule: Schedule = Object.fromEntries(
  [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day, index) => [
    day,
    {
      enabled: index < 5,
      start: "09:00",
      end: index === 4 ? "16:00" : "17:00",
    },
  ]),
);
const navItems: Array<{ view: View; label: string; icon: string }> = [
  { view: "overview", label: "Overview", icon: "O" },
  { view: "appointments", label: "See All Appointments", icon: "A" },
  { view: "schedules", label: "Edit Schedules", icon: "S" },
  { view: "calendar", label: "Calendar", icon: "C" },
];

function storedAppointments() {
  try {
    return (
      (JSON.parse(
        localStorage.getItem(storageKey) ?? "null",
      ) as Appointment[]) ?? demoAppointments
    );
  } catch {
    return demoAppointments;
  }
}
function apiAppointment(item: ApiAppointment): Appointment {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time);
  return {
    id: String(item.id),
    backendId: item.id,
    title: item.title,
    clientName: item.title,
    caseFile: item.description ?? "General appointment",
    date: dateValue(start),
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    duration: Math.max(
      15,
      Math.round((end.getTime() - start.getTime()) / 60000),
    ),
    venue: "Virtual Meeting",
    location: "Online",
    status: item.status,
    notes: item.description ?? "",
    createdAt: item.created_at,
  };
}

export default function ChronoApp() {
  const [appointments, setAppointments] =
    useState<Appointment[]>(storedAppointments);
  const [view, setView] = useState<View>("overview");
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [month, setMonth] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [sortBy, setSortBy] = useState("date");
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("month");
  const hasPersistedAppointments = localStorage.getItem(storageKey) !== null;
  const [loading, setLoading] = useState(!hasPersistedAppointments);
  const [currentTime, setCurrentTime] = useState(now);
  const [drawer, setDrawer] = useState(false);
  const [modal, setModal] = useState<
    "appointment" | "details" | "delete" | null
  >(null);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([
    "Upcoming appointment reminder",
    "Schedule synced successfully",
  ]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(() => {
    try {
      return (
        JSON.parse(localStorage.getItem(scheduleKey) ?? "null") ??
        defaultSchedule
      );
    } catch {
      return defaultSchedule;
    }
  });
  const [duration, setDuration] = useState(45);
  const [buffer, setBuffer] = useState(15);
  const [maxDaily, setMaxDaily] = useState(8);
  const [form, setForm] = useState<Draft>({
    title: "",
    clientName: "",
    caseFile: "",
    date: currentDate,
    startTime: "09:00",
    duration: 45,
    venue: "Virtual Meeting",
    location: "",
    status: "scheduled",
    notes: "",
  });
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(appointments));
  }, [appointments]);
  useEffect(() => {
    if (hasPersistedAppointments) {
      return;
    }

    api
      .fetchAppointments()
      .then((data) => {
        if (data.length) setAppointments(data.map(apiAppointment));
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    const timer = window.setTimeout(() => setLoading(false), 2500);
    return () => window.clearTimeout(timer);
  }, [hasPersistedAppointments]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModal(null);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const active = appointments.filter((item) => item.status !== "archived");
  const todayItems = active.filter((item) => item.date === selectedDate);
  const filtered = active
    .filter((item) => {
      const text = [
        item.title,
        item.clientName,
        item.caseFile,
        item.venue,
        item.location,
        item.notes,
      ]
        .join(" ")
        .toLowerCase();
      const matchesText = text.includes(search.toLowerCase());
      const matchesStatus =
        status === "all" ||
        item.status === status ||
        (status === "active" && item.status === "scheduled");
      return matchesText && matchesStatus;
    })
    .sort((a, b) =>
      sortBy === "title"
        ? a.title.localeCompare(b.title)
        : `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
    );
  const stats = {
    total: active.length,
    today: todayItems.length,
    completed: todayItems.filter((item) => item.status === "completed").length,
    pending: todayItems.filter((item) =>
      ["pending", "scheduled", "confirmed", "active"].includes(item.status),
    ).length,
    cancelled: appointments.filter((item) => item.status === "cancelled")
      .length,
  };
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [month]);
  const onDate = (value: string) =>
    active.filter((item) => item.date === value);
  const notify = (message: string) => {
    setToast(message);
    setNotifications((items) => [message, ...items].slice(0, 5));
  };
  const go = (next: View) => {
    setView(next);
    setDrawer(false);
    setSearch("");
    setStatus("all");
  };
  const openCreate = (date = selectedDate) => {
    setEditing(null);
    setSelected(null);
    setForm({
      title: "",
      clientName: "",
      caseFile: "",
      date,
      startTime: "09:00",
      duration,
      venue: "Virtual Meeting",
      location: "",
      status: "scheduled",
      notes: "",
    });
    setModal("appointment");
  };
  const openEdit = (item: Appointment) => {
    setEditing(item);
    setSelected(item);
    setForm({ ...item });
    setModal("appointment");
  };
  const openDetails = (item: Appointment) => {
    setSelected(item);
    setModal("details");
  };
  const saveAppointment = async (draft: Draft) => {
    setSaving(true);
    const old = editing;
    const item: Appointment = {
      ...draft,
      id: old?.id ?? crypto.randomUUID(),
      backendId: old?.backendId,
      createdAt: old?.createdAt ?? new Date().toISOString(),
    };
    const payload = {
      title: item.title,
      description: item.notes || item.caseFile,
      start_time: item.date + "T" + item.startTime + ":00",
      end_time:
        item.date +
        "T" +
        timeValue(minutes(item.startTime) + item.duration) +
        ":00",
    };
    try {
      let saved = item;
      try {
        if (item.backendId) {
          const result = await api.updateAppointment(item.backendId, payload);
          saved = {
            ...item,
            ...apiAppointment(result),
            id: item.id,
            backendId: result.id,
          };
        } else {
          const result = await api.createAppointment(payload);
          saved = { ...item, id: String(result.id), backendId: result.id };
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to check appointment availability";
        const lowerMessage = message.toLowerCase();
        if (
          lowerMessage.includes("conflict") ||
          lowerMessage.includes("overlap") ||
          lowerMessage.includes("already booked")
        )
          throw new Error(
            "This appointment conflicts with an existing booking. Choose another time.",
            { cause: error },
          );
      }
      setAppointments((items) =>
        old
          ? items.map((entry) => (entry.id === old.id ? saved : entry))
          : [saved, ...items],
      );
      setModal(null);
      notify(
        old
          ? "Appointment updated successfully"
          : "Appointment created successfully",
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Unable to save appointment",
      );
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = async (item: Appointment, next: Status) => {
    setAppointments((items) =>
      items.map((entry) =>
        entry.id === item.id ? { ...entry, status: next } : entry,
      ),
    );
    setSelected((entry) =>
      entry?.id === item.id ? { ...entry, status: next } : entry,
    );
    if (item.backendId && (next === "completed" || next === "cancelled")) {
      try {
        if (next === "completed") {
          await api.completeAppointment(item.backendId);
        } else {
          await api.cancelAppointment(item.backendId);
        }
      } catch {
        /* local state remains */
      }
    }
    notify(`Appointment marked ${next}`);
  };
  const archive = (item: Appointment) => {
    setAppointments((items) =>
      items.map((entry) =>
        entry.id === item.id ? { ...entry, status: "archived" } : entry,
      ),
    );
    setModal(null);
    notify("Appointment archived");
  };
  const deleteItem = () => {
    if (!selected) return;
    setAppointments((items) => items.filter((item) => item.id !== selected.id));
    setModal(null);
    notify("Appointment deleted successfully");
  };
  const restore = (item: Appointment) => {
    setAppointments((items) =>
      items.map((entry) =>
        entry.id === item.id ? { ...entry, status: "scheduled" } : entry,
      ),
    );
    notify("Appointment restored");
  };
  const csv = () => {
    const rows = [
      [
        "ID",
        "Title",
        "Client",
        "Case File",
        "Date",
        "Start Time",
        "Duration",
        "Venue",
        "Status",
        "Notes",
      ],
      ...filtered.map((item) => [
        item.id,
        item.title,
        item.clientName,
        item.caseFile,
        item.date,
        item.startTime,
        item.duration,
        item.venue,
        item.status,
        item.notes,
      ]),
    ];
    const content = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    link.download = "chrono-appointments.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    notify("CSV downloaded");
  };
  const saveSchedule = () => {
    localStorage.setItem(scheduleKey, JSON.stringify(schedule));
    notify("Schedule saved successfully");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${drawer ? "sidebar-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">C</span>
          <span>CHRONO</span>
        </div>
        <div className="nav-label">Navigation</div>
        <nav>
          {navItems.map((item) => (
            <button
              className={`nav-item ${view === item.view ? "active" : ""}`}
              key={item.view}
              onClick={() => go(item.view)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <button className="archive-link" onClick={() => go("archive")}>
          <span className="nav-icon">A</span>Archived
        </button>
        <div className="sidebar-footer">
          <span className="user-avatar">U</span>
          <div>
            <strong>Workspace owner</strong>
            <span>Admin account</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setDrawer(!drawer)}
            aria-label="Open navigation"
          >
            =
          </button>
          <div className="date-heading">
            <span>
              Good{" "}
              {currentTime.getHours() < 12
                ? "morning"
                : currentTime.getHours() < 18
                  ? "afternoon"
                  : "evening"}
              ,
            </span>
            <strong>
              {currentTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </strong>
            <small>
              {currentTime.toLocaleDateString("en-US", { weekday: "long" })} ·{" "}
              {Intl.DateTimeFormat().resolvedOptions().timeZone} ·{" "}
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </small>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              aria-label="Notifications"
            >
              !{notifications.length > 0 && <i />}
            </button>
            <button
              className="profile-button"
              onClick={() => setProfileOpen(!profileOpen)}
              aria-label="Profile"
            >
              U
            </button>
            <button className="primary-button" onClick={() => openCreate()}>
              + New Appointment
            </button>
          </div>
          {notificationsOpen && (
            <div className="popover notification-popover">
              <strong>Notifications</strong>
              {notifications.map((item, index) => (
                <button
                  key={`${item}-${index}`}
                  onClick={() =>
                    setNotifications((items) =>
                      items.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  {item}
                  <small>Dismiss</small>
                </button>
              ))}
            </div>
          )}
          {profileOpen && (
            <div className="popover profile-popover">
              <button>Profile</button>
              <button>Settings</button>
              <button onClick={() => notify("Signed out placeholder ready")}>
                Sign out
              </button>
            </div>
          )}
        </header>
        <div className="content-area">
          {view === "overview" && (
            <Dashboard
              stats={stats}
              items={todayItems}
              date={selectedDate}
              setDate={setSelectedDate}
              month={month}
              setMonth={setMonth}
              days={days}
              onDate={onDate}
              onOpen={openDetails}
              onCreate={openCreate}
              onEdit={openEdit}
              onStatus={changeStatus}
              onArchive={archive}
              onDownload={csv}
              onArchiveView={() => go("archive")}
              loading={loading}
              greeting={`${currentTime.getHours() < 12 ? "Good morning" : currentTime.getHours() < 18 ? "Good afternoon" : "Good evening"}, Workspace Owner`}
            />
          )}
          {view === "appointments" && (
            <AppointmentsPage
              items={filtered}
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onOpen={openDetails}
              onEdit={openEdit}
              onDownload={csv}
            />
          )}
          {view === "archive" && (
            <ArchivePage
              items={appointments.filter((item) => item.status === "archived")}
              onRestore={restore}
              onOpen={openDetails}
              onDelete={(item: Appointment) => {
                setSelected(item);
                setModal("delete");
              }}
            />
          )}
          {view === "schedules" && (
            <SchedulePage
              schedule={schedule}
              setSchedule={setSchedule}
              duration={duration}
              setDuration={setDuration}
              buffer={buffer}
              setBuffer={setBuffer}
              maxDaily={maxDaily}
              setMaxDaily={setMaxDaily}
              onSave={saveSchedule}
            />
          )}
          {view === "calendar" && (
            <CalendarPage
              month={month}
              setMonth={setMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              days={days}
              onDate={onDate}
              mode={calendarMode}
              setMode={setCalendarMode}
              onOpen={openDetails}
              onCreate={openCreate}
            />
          )}
        </div>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={view === "appointments" ? "active" : ""}
          onClick={() => go("appointments")}
        >
          <span>▣</span>
          Appointments
        </button>
        <button
          className={view === "calendar" ? "active" : ""}
          onClick={() => go("calendar")}
        >
          <span>□</span>
          Calendar
        </button>
        <button
          className="mobile-add-button"
          onClick={() => openCreate()}
          aria-label="Create new appointment"
        >
          +
        </button>
        <button
          className={view === "schedules" ? "active" : ""}
          onClick={() => go("schedules")}
        >
          <span>✎</span>
          Schedules
        </button>
        <button
          className={view === "archive" ? "active" : ""}
          onClick={() => go("archive")}
        >
          <span>⌁</span>
          Archived
        </button>
      </nav>
      {modal === "appointment" && (
        <AppointmentModal
          draft={form}
          setDraft={setForm}
          editing={Boolean(editing)}
          saving={saving}
          close={() => setModal(null)}
          submit={saveAppointment}
        />
      )}
      {modal === "details" && selected && (
        <DetailsModal
          item={selected}
          close={() => setModal(null)}
          edit={() => openEdit(selected)}
          complete={() => changeStatus(selected, "completed")}
          cancel={() => changeStatus(selected, "cancelled")}
          archive={() => archive(selected)}
          remove={() => setModal("delete")}
        />
      )}
      {modal === "delete" && (
        <ConfirmModal close={() => setModal(null)} confirm={deleteItem} />
      )}
      {toast && (
        <div
          className={
            toast.toLowerCase().includes("conflict") ||
            toast.toLowerCase().includes("unable")
              ? "toast error"
              : "toast"
          }
        >
          + <span>{toast}</span>
          <button onClick={() => setToast("")}>x</button>
        </div>
      )}
    </div>
  );
}

type DashboardProps = {
  stats: {
    total: number;
    today: number;
    completed: number;
    pending: number;
    cancelled: number;
  };
  items: Appointment[];
  date: string;
  setDate: (value: string) => void;
  month: Date;
  setMonth: (value: Date) => void;
  days: Date[];
  onDate: (value: string) => Appointment[];
  onOpen: (item: Appointment) => void;
  onCreate: (date?: string) => void;
  onEdit: (item: Appointment) => void;
  onStatus: (item: Appointment, status: Status) => void;
  onArchive: (item: Appointment) => void;
  onDownload: () => void;
  onArchiveView: () => void;
  loading: boolean;
  greeting: string;
};
function Dashboard({
  stats,
  items,
  date,
  setDate,
  month,
  setMonth,
  days,
  onDate,
  onOpen,
  onCreate,
  onEdit,
  onStatus,
  onArchive,
  onDownload,
  onArchiveView,
  loading,
  greeting,
}: DashboardProps) {
  return (
    <div className="page">
      <PageIntro
        eyebrow="Overview"
        title={greeting}
        subtitle="A clear view of your schedule and today's priorities."
      />
      <div className="kpi-grid">
        <Kpi
          label="Total scheduled"
          value={stats.total}
          trend="+ 12.4%"
          detail="Rolling 30-day baseline"
        />
        <Kpi
          label="Today's load"
          value={stats.today}
          trend={`${stats.completed} completed`}
          detail={`${stats.pending} pending`}
          progress={
            stats.today ? Math.round((stats.completed / stats.today) * 100) : 0
          }
        />
        <Kpi
          label="Cancellations"
          value={stats.cancelled}
          trend="Current period"
          detail="Cancelled appointments"
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel agenda-panel">
          <div className="panel-heading">
            <div>
              <h2>Today's Agenda</h2>
              <p>{longDate(date)}</p>
            </div>
            <div className="heading-actions">
              <button
                className="ghost-button"
                onClick={() => setDate(currentDate)}
              >
                Today
              </button>
              <button className="ghost-button" onClick={onDownload}>
                Download CSV
              </button>
            </div>
          </div>
          <Agenda
            items={items}
            onOpen={onOpen}
            onEdit={onEdit}
            onStatus={onStatus}
            onArchive={onArchive}
            loading={loading}
            onCreate={() => onCreate(date)}
          />
          <div className="panel-footer">
            <span>Showing {items.length} records</span>
            <button className="text-button" onClick={onArchiveView}>
              View archived
            </button>
          </div>
        </section>
        <MiniCalendar
          month={month}
          setMonth={setMonth}
          selectedDate={date}
          setSelectedDate={setDate}
          days={days}
          onDate={onDate}
          onCreate={onCreate}
        />
      </div>
    </div>
  );
}
function Kpi({
  label,
  value,
  trend,
  detail,
  progress,
}: {
  label: string;
  value: number;
  trend: string;
  detail: string;
  progress?: number;
}) {
  return (
    <section className="kpi-card">
      <div className="kpi-label">
        <span>{label}</span>
        <em>{trend}</em>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
      {progress !== undefined && (
        <div className="progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
    </section>
  );
}
function PageIntro({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}
function Agenda({
  items,
  onOpen,
  onEdit,
  onStatus,
  onArchive,
  loading,
  onCreate,
}: {
  items: Appointment[];
  onOpen: (item: Appointment) => void;
  onEdit: (item: Appointment) => void;
  onStatus: (item: Appointment, status: Status) => void;
  onArchive: (item: Appointment) => void;
  loading: boolean;
  onCreate: () => void;
}) {
  return (
    <>
      <div className="agenda-table">
        <div className="agenda-header">
          <span>Time & duration</span>
          <span>Client & case file</span>
          <span>Venue / channel</span>
          <span>Status</span>
        </div>
        {loading ? (
          <div className="empty-state">Loading schedule...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <strong>Nothing scheduled for this day.</strong>
            <span>Create your first appointment to get started.</span>
            <button className="primary-button" onClick={onCreate}>
              + New Appointment
            </button>
          </div>
        ) : (
          items
            .slice()
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((item) => (
              <div
                className="agenda-row"
                key={item.id}
                onClick={() => onOpen(item)}
              >
                <div>
                  <strong>
                    {new Date(
                      `2000-01-01T${item.startTime}`,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </strong>
                  <small>{item.duration} min window</small>
                </div>
                <div className="client-cell">
                  <span className="client-avatar">
                    {item.clientName
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{item.clientName}</strong>
                    <small>{item.caseFile}</small>
                  </div>
                </div>
                <div>
                  <span className="venue">@</span>
                  {item.venue}
                </div>
                <div className="status-cell">
                  <StatusBadge status={item.status} />
                  <div
                    className="row-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button onClick={() => onEdit(item)}>Edit</button>
                    {item.status !== "completed" &&
                      item.status !== "cancelled" && (
                        <button onClick={() => onStatus(item, "completed")}>
                          Done
                        </button>
                      )}
                    <button onClick={() => onArchive(item)}>Archive</button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
      <div className="agenda-mobile-list">
        {loading ? (
          <div className="empty-state">Loading schedule...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <strong>Nothing scheduled for this day.</strong>
            <span>Create your first appointment to get started.</span>
            <button className="primary-button" onClick={onCreate}>
              + New Appointment
            </button>
          </div>
        ) : (
          items
            .slice()
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((item) => (
              <article
                className="mobile-appointment-card"
                key={item.id}
                onClick={() => onOpen(item)}
              >
                <div className="mobile-card-topline">
                  <div>
                    <strong>
                      {new Date(
                        `2000-01-01T${item.startTime}`,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                    <small>{item.duration} min window</small>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                <div className="mobile-card-client">
                  <span className="client-avatar">
                    {item.clientName
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{item.clientName}</strong>
                    <small>{item.caseFile}</small>
                  </div>
                </div>
                <div className="mobile-card-venue">
                  <span className="venue">@</span>
                  {item.venue}
                </div>
                <div
                  className="mobile-card-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button onClick={() => onOpen(item)}>View</button>
                  <button onClick={() => onEdit(item)}>Edit</button>
                  {item.status !== "completed" &&
                    item.status !== "cancelled" && (
                      <button onClick={() => onStatus(item, "completed")}>
                        Done
                      </button>
                    )}
                  <button onClick={() => onArchive(item)}>Archive</button>
                </div>
              </article>
            ))
        )}
      </div>
    </>
  );
}
function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge ${status}`}>
      <i />
      {status}
    </span>
  );
}
function MiniCalendar({
  month,
  setMonth,
  selectedDate,
  setSelectedDate,
  days,
  onDate,
  onCreate,
}: {
  month: Date;
  setMonth: (value: Date) => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  days: Date[];
  onDate: (value: string) => Appointment[];
  onCreate: (date?: string) => void;
}) {
  return (
    <aside className="panel mini-calendar">
      <div className="calendar-title">
        <h2>
          {month.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <div>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            &lt;
          </button>
          <button
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            &gt;
          </button>
        </div>
      </div>
      <div className="weekdays">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const value = dateValue(day);
          const entries = onDate(value);
          return (
            <button
              key={value}
              className={`${day.getMonth() === month.getMonth() ? "" : "muted"} ${value === selectedDate ? "selected" : ""} ${value === currentDate ? "today" : ""}`}
              onClick={() => {
                setSelectedDate(value);
                if (day.getMonth() !== month.getMonth())
                  setMonth(new Date(day.getFullYear(), day.getMonth(), 1));
              }}
              onDoubleClick={() => onCreate(value)}
            >
              {day.getDate()}
              {entries.length > 0 && <i>{entries.length}</i>}
            </button>
          );
        })}
      </div>
      <div className="calendar-foot">
        <span>* {onDate(selectedDate).length} bookings selected</span>
        <button
          className="text-button"
          onClick={() => {
            setSelectedDate(currentDate);
            setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          Jump to today
        </button>
      </div>
    </aside>
  );
}
function AppointmentsPage({
  items,
  search,
  setSearch,
  status,
  setStatus,
  sortBy,
  setSortBy,
  onOpen,
  onEdit,
  onDownload,
}: {
  items: Appointment[];
  search: string;
  setSearch: (value: string) => void;
  status: "all" | Status;
  setStatus: (value: "all" | Status) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  onOpen: (item: Appointment) => void;
  onEdit: (item: Appointment) => void;
  onDownload: () => void;
}) {
  return (
    <div className="page">
      <PageIntro
        eyebrow="Workspace"
        title="All Appointments"
        subtitle="Manage and track all your scheduled appointments."
        action={
          <button className="primary-button" onClick={onDownload}>
            Download CSV
          </button>
        }
      />
      <div className="toolbar">
        <div className="inline-search">
          ?
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search appointments..."
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "all" | Status)}
        >
          <option value="all">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          <option value="date">Sort by date</option>
          <option value="title">Sort by title</option>
        </select>
      </div>
      <section className="panel full-table">
        <div className="appointments-table">
          <div className="table-head">
            <span>Date</span>
            <span>Time</span>
            <span>Appointment</span>
            <span>Client</span>
            <span>Venue</span>
            <span>Status</span>
            <span>Actions</span>
          </div>
          {items.length === 0 ? (
            <div className="empty-state">
              <strong>No appointments found</strong>
              <span>Try adjusting your search or filters.</span>
            </div>
          ) : (
            items.map((item) => (
              <div
                className="table-row"
                key={item.id}
                onClick={() => onOpen(item)}
              >
                <span>{displayDate(item.date)}</span>
                <span>{item.startTime}</span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.caseFile}</small>
                </span>
                <span>{item.clientName}</span>
                <span>{item.venue}</span>
                <StatusBadge status={item.status} />
                <span className="row-actions">
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(item);
                    }}
                  >
                    Edit
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
function ArchivePage({
  items,
  onRestore,
  onOpen,
  onDelete,
}: {
  items: Appointment[];
  onRestore: (item: Appointment) => void;
  onOpen: (item: Appointment) => void;
  onDelete: (item: Appointment) => void;
}) {
  return (
    <div className="page">
      <PageIntro
        eyebrow="Workspace"
        title="Archived Appointments"
        subtitle="Restore old records or permanently remove them."
      />
      {items.length === 0 ? (
        <section className="panel empty-state">
          <strong>No archived appointments</strong>
          <span>Archived records will appear here.</span>
        </section>
      ) : (
        <section className="panel archive-list">
          {items.map((item) => (
            <div className="archive-row" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.clientName} · {displayDate(item.date)}
                </span>
              </div>
              <StatusBadge status={item.status} />
              <button className="ghost-button" onClick={() => onOpen(item)}>
                View
              </button>
              <button className="ghost-button" onClick={() => onRestore(item)}>
                Restore
              </button>
              <button className="danger-button" onClick={() => onDelete(item)}>
                Delete
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
function SchedulePage({
  schedule,
  setSchedule,
  duration,
  setDuration,
  buffer,
  setBuffer,
  maxDaily,
  setMaxDaily,
  onSave,
}: {
  schedule: Schedule;
  setSchedule: React.Dispatch<React.SetStateAction<Schedule>>;
  duration: number;
  setDuration: (value: number) => void;
  buffer: number;
  setBuffer: (value: number) => void;
  maxDaily: number;
  setMaxDaily: (value: number) => void;
  onSave: () => void;
}) {
  return (
    <div className="page">
      <PageIntro
        eyebrow="Workspace"
        title="Edit Schedules"
        subtitle="Define working hours and appointment capacity for your team."
        action={
          <button className="primary-button" onClick={onSave}>
            Save schedule
          </button>
        }
      />
      <div className="schedule-grid">
        <section className="panel schedule-panel">
          <div className="panel-heading">
            <div>
              <h2>Working hours</h2>
              <p>Set the days and times you accept appointments.</p>
            </div>
          </div>
          {Object.entries(schedule).map(([day, value]) => (
            <div className="schedule-row" key={day}>
              <label>
                <input
                  type="checkbox"
                  checked={value.enabled}
                  onChange={(event) =>
                    setSchedule((items) => ({
                      ...items,
                      [day]: { ...items[day], enabled: event.target.checked },
                    }))
                  }
                />
                <strong>{day}</strong>
              </label>
              <input
                type="time"
                value={value.start}
                disabled={!value.enabled}
                onChange={(event) =>
                  setSchedule((items) => ({
                    ...items,
                    [day]: { ...items[day], start: event.target.value },
                  }))
                }
              />
              <span>to</span>
              <input
                type="time"
                value={value.end}
                disabled={!value.enabled}
                onChange={(event) =>
                  setSchedule((items) => ({
                    ...items,
                    [day]: { ...items[day], end: event.target.value },
                  }))
                }
              />
            </div>
          ))}
        </section>
        <section className="panel settings-panel">
          <h2>Appointment settings</h2>
          <p>Control how new slots are created.</p>
          <label>
            Default duration
            <select
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            >
              {[15, 30, 45, 60, 90].map((value) => (
                <option key={value} value={value}>
                  {value} minutes
                </option>
              ))}
            </select>
          </label>
          <label>
            Buffer between appointments
            <input
              type="number"
              min="0"
              value={buffer}
              onChange={(event) => setBuffer(Number(event.target.value))}
            />
          </label>
          <label>
            Maximum appointments per day
            <input
              type="number"
              min="1"
              value={maxDaily}
              onChange={(event) => setMaxDaily(Number(event.target.value))}
            />
          </label>
          <div className="breaks">
            <h3>Breaks</h3>
            <p>Add break periods from the working hours view when needed.</p>
            <button className="ghost-button" onClick={onSave}>
              + Add break
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
function CalendarPage({
  month,
  setMonth,
  selectedDate,
  setSelectedDate,
  days,
  onDate,
  mode,
  setMode,
  onOpen,
  onCreate,
}: {
  month: Date;
  setMonth: (value: Date) => void;
  selectedDate: string;
  setSelectedDate: (value: string) => void;
  days: Date[];
  onDate: (value: string) => Appointment[];
  mode: CalendarMode;
  setMode: (value: CalendarMode) => void;
  onOpen: (item: Appointment) => void;
  onCreate: (date?: string) => void;
}) {
  const selectedDay = new Date(`${selectedDate}T12:00:00`);
  const weekStart = new Date(selectedDay);
  weekStart.setDate(selectedDay.getDate() - ((selectedDay.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });
  const visible =
    mode === "month" ? days : mode === "day" ? [selectedDay] : weekDays;
  const movePeriod = (direction: number) => {
    if (mode === "month") {
      setMonth(new Date(month.getFullYear(), month.getMonth() + direction, 1));
      return;
    }

    const nextDate = new Date(selectedDay);
    nextDate.setDate(
      selectedDay.getDate() + (mode === "week" ? direction * 7 : direction),
    );
    setSelectedDate(dateValue(nextDate));
    setMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
  };
  return (
    <div className="page">
      <PageIntro
        eyebrow="Workspace"
        title="Calendar"
        subtitle="Plan, review, and create appointments from one shared calendar."
        action={
          <button
            className="primary-button"
            onClick={() => onCreate(selectedDate)}
          >
            + New Appointment
          </button>
        }
      />
      <section className="panel full-calendar">
        <div className="calendar-toolbar">
          <div>
            <button
              className="ghost-button"
              onClick={() => {
                setSelectedDate(currentDate);
                setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
            >
              Today
            </button>
            <button onClick={() => movePeriod(-1)}>&lt;</button>
            <button onClick={() => movePeriod(1)}>&gt;</button>
            <strong>
              {mode === "day"
                ? selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : mode === "week"
                  ? `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : month.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
            </strong>
          </div>
          <div className="segmented">
            {(["month", "week", "day"] as CalendarMode[]).map((item) => (
              <button
                className={mode === item ? "active" : ""}
                key={item}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className={`full-calendar-grid ${mode}`}>
          {visible.map((day) => {
            const value = dateValue(day);
            return (
              <div
                className={`calendar-cell ${value === selectedDate ? "selected" : ""}`}
                key={value}
                onClick={() => setSelectedDate(value)}
              >
                <div className="cell-date">
                  <strong>{day.getDate()}</strong>
                  <small>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </small>
                </div>
                {onDate(value).map((item) => (
                  <button
                    className={`calendar-event ${item.status}`}
                    key={item.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(item);
                    }}
                  >
                    {item.startTime} · {item.title}
                  </button>
                ))}
                <button
                  className="add-slot"
                  onClick={(event) => {
                    event.stopPropagation();
                    onCreate(value);
                  }}
                >
                  +
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {children}
    </div>
  );
}
function ModalHeader({
  title,
  subtitle,
  close,
}: {
  title: string;
  subtitle: string;
  close: () => void;
}) {
  return (
    <div className="modal-header">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <button onClick={close} aria-label="Close modal">
        x
      </button>
    </div>
  );
}
function AppointmentModal({
  draft,
  setDraft,
  editing,
  saving,
  close,
  submit,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  editing: boolean;
  saving: boolean;
  close: () => void;
  submit: (draft: Draft) => void;
}) {
  const [errors, setErrors] = useState<string[]>([]);
  const update = (key: keyof Draft, value: string | number) =>
    setDraft((item) => ({ ...item, [key]: value }));
  const handle = (event: React.FormEvent) => {
    event.preventDefault();
    const next = [
      !draft.title.trim() && "Appointment title is required.",
      !draft.clientName.trim() && "Client name is required.",
      !draft.date && "Date is required.",
      minutes(draft.startTime) + Number(draft.duration) > 1440 &&
        "The appointment must end before midnight.",
    ].filter(Boolean) as string[];
    if (next.length) {
      setErrors(next);
      return;
    }
    submit(draft);
  };
  return (
    <Modal close={close}>
      <form className="modal-card appointment-modal" onSubmit={handle}>
        <ModalHeader
          title={editing ? "Edit Appointment" : "Create New Appointment"}
          subtitle="Schedule a new meeting or appointment"
          close={close}
        />
        {errors.length > 0 && (
          <div className="form-errors">
            {errors.map((error) => (
              <span key={error}>{error}</span>
            ))}
          </div>
        )}
        <div className="form-grid">
          <label className="wide">
            Appointment title
            <input
              autoFocus
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Project Kickoff"
            />
          </label>
          <label>
            Client name
            <input
              value={draft.clientName}
              onChange={(event) => update("clientName", event.target.value)}
              placeholder="Search or enter client name"
            />
          </label>
          <label>
            Case file / topic
            <input
              value={draft.caseFile}
              onChange={(event) => update("caseFile", event.target.value)}
              placeholder="Enter case file or topic"
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={draft.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
          <label>
            Start time
            <input
              type="time"
              value={draft.startTime}
              onChange={(event) => update("startTime", event.target.value)}
            />
          </label>
          <label>
            Duration
            <select
              value={draft.duration}
              onChange={(event) =>
                update("duration", Number(event.target.value))
              }
            >
              {[15, 30, 45, 60, 90, 120].map((value) => (
                <option key={value} value={value}>
                  {value === 120 ? "2 hours" : `${value} min`}
                </option>
              ))}
            </select>
          </label>
          <label>
            Venue / channel
            <select
              value={draft.venue}
              onChange={(event) => update("venue", event.target.value)}
            >
              {[
                "Virtual Meeting",
                "Office",
                "Phone Call",
                "Studio Room",
                "Client Location",
                "Other",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Specific location
            <input
              value={draft.location}
              onChange={(event) => update("location", event.target.value)}
              placeholder="Room or meeting link"
            />
          </label>
          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) =>
                update("status", event.target.value as Status)
              }
            >
              {["scheduled", "confirmed", "pending"].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            Notes
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Add useful context for this appointment"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={close}>
            Cancel
          </button>
          <button className="primary-button" disabled={saving}>
            {saving && <span className="button-spinner" />}{" "}
            {saving
              ? "Checking conflicts..."
              : editing
                ? "Save changes"
                : "Create Appointment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function DetailsModal({
  item,
  close,
  edit,
  complete,
  cancel,
  archive,
  remove,
}: {
  item: Appointment;
  close: () => void;
  edit: () => void;
  complete: () => void;
  cancel: () => void;
  archive: () => void;
  remove: () => void;
}) {
  return (
    <Modal close={close}>
      <div className="modal-card details-modal">
        <ModalHeader
          title={item.title}
          subtitle="Appointment details"
          close={close}
        />
        <div className="detail-hero">
          <span className="client-avatar large">
            {item.clientName
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{item.clientName}</strong>
            <span>{item.caseFile}</span>
          </div>
          <StatusBadge status={item.status} />
        </div>
        <dl className="details-grid">
          <div>
            <dt>Date</dt>
            <dd>{longDate(item.date)}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>
              {item.startTime} · {item.duration} min
            </dd>
          </div>
          <div>
            <dt>Venue</dt>
            <dd>{item.venue}</dd>
          </div>
          <div>
            <dt>Location</dt>
            <dd>{item.location || "Not specified"}</dd>
          </div>
          <div className="wide">
            <dt>Notes</dt>
            <dd>{item.notes || "No notes added."}</dd>
          </div>
        </dl>
        <div className="modal-actions">
          <button className="ghost-button" onClick={edit}>
            Edit Appointment
          </button>
          {item.status !== "completed" && (
            <button className="primary-button" onClick={complete}>
              Mark Completed
            </button>
          )}
          {item.status !== "cancelled" && (
            <button className="danger-button" onClick={cancel}>
              Cancel
            </button>
          )}
          <button className="ghost-button" onClick={archive}>
            Archive
          </button>
          <button className="danger-button" onClick={remove}>
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
function ConfirmModal({
  close,
  confirm,
}: {
  close: () => void;
  confirm: () => void;
}) {
  return (
    <Modal close={close}>
      <div className="modal-card confirm-modal">
        <div className="warning-icon">!</div>
        <h2>Delete Appointment?</h2>
        <p>This action cannot be undone.</p>
        <div className="modal-actions">
          <button className="ghost-button" onClick={close}>
            Cancel
          </button>
          <button className="danger-button" onClick={confirm}>
            Delete Appointment
          </button>
        </div>
      </div>
    </Modal>
  );
}

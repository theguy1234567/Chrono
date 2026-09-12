export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface Appointment {
  id: number;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
}

export interface AppointmentPayload {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

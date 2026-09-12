import type {
  Appointment,
  AppointmentPayload,
  AppointmentStatus,
} from "../types/appointment";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function handleResponse<T>(response: Response): Promise<T> {
  return response.json().then((data) => {
    if (!response.ok) {
      const message =
        typeof data?.detail === "string" ? data.detail : "Request failed";
      throw new Error(message);
    }

    return data as T;
  });
}

export const api = {
  async fetchAppointments(date?: string, status?: "all" | AppointmentStatus) {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status && status !== "all") params.set("status", status);

    const query = params.toString();
    const response = await fetch(
      `${API_BASE}/appointments${query ? `?${query}` : ""}`,
    );
    return handleResponse<Appointment[]>(response);
  },

  async createAppointment(payload: AppointmentPayload) {
    const response = await fetch(`${API_BASE}/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return handleResponse<Appointment>(response);
  },

  async updateAppointment(id: number, payload: Partial<AppointmentPayload>) {
    const response = await fetch(`${API_BASE}/appointments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return handleResponse<Appointment>(response);
  },

  async completeAppointment(id: number) {
    const response = await fetch(`${API_BASE}/appointments/${id}/complete`, {
      method: "PATCH",
    });

    return handleResponse<Appointment>(response);
  },

  async cancelAppointment(id: number) {
    const response = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
      method: "PATCH",
    });

    return handleResponse<Appointment>(response);
  },
};

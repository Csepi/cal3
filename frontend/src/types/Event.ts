export interface Event {
  id: number;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
}

export interface CreateEventRequest {
  title: string;
  date: string;
}
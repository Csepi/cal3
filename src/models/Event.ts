export interface Event {
    id?: number;
    title: string;
    date: string; // ISO date string (YYYY-MM-DD)
    created_at?: Date;
    updated_at?: Date;
}

export interface CreateEventRequest {
    title: string;
    date: string;
}

export interface EventResponse {
    id: number;
    title: string;
    date: string;
}
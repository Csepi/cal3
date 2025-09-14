import pool from '../database';
import { Event, CreateEventRequest, EventResponse } from '../models/Event';

export class EventService {

    // Get all events
    static async getAllEvents(): Promise<EventResponse[]> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, title, date FROM events ORDER BY date ASC'
            );

            return result.rows.map(row => ({
                id: row.id,
                title: row.title,
                date: row.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
            }));
        } catch (error) {
            console.error('Error getting events:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Create a new event
    static async createEvent(eventData: CreateEventRequest): Promise<EventResponse> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'INSERT INTO events (title, date) VALUES ($1, $2) RETURNING id, title, date',
                [eventData.title, eventData.date]
            );

            const row = result.rows[0];
            return {
                id: row.id,
                title: row.title,
                date: row.date.toISOString().split('T')[0]
            };
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Get event by ID
    static async getEventById(id: number): Promise<EventResponse | null> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT id, title, date FROM events WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                id: row.id,
                title: row.title,
                date: row.date.toISOString().split('T')[0]
            };
        } catch (error) {
            console.error('Error getting event by ID:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // Delete event
    static async deleteEvent(id: number): Promise<boolean> {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM events WHERE id = $1',
                [id]
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        } finally {
            client.release();
        }
    }
}
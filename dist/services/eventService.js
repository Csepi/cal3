"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const database_1 = __importDefault(require("../database"));
class EventService {
    // Get all events
    static async getAllEvents() {
        const client = await database_1.default.connect();
        try {
            const result = await client.query('SELECT id, title, date FROM events ORDER BY date ASC');
            return result.rows.map(row => ({
                id: row.id,
                title: row.title,
                date: row.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
            }));
        }
        catch (error) {
            console.error('Error getting events:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Create a new event
    static async createEvent(eventData) {
        const client = await database_1.default.connect();
        try {
            const result = await client.query('INSERT INTO events (title, date) VALUES ($1, $2) RETURNING id, title, date', [eventData.title, eventData.date]);
            const row = result.rows[0];
            return {
                id: row.id,
                title: row.title,
                date: row.date.toISOString().split('T')[0]
            };
        }
        catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Get event by ID
    static async getEventById(id) {
        const client = await database_1.default.connect();
        try {
            const result = await client.query('SELECT id, title, date FROM events WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return null;
            }
            const row = result.rows[0];
            return {
                id: row.id,
                title: row.title,
                date: row.date.toISOString().split('T')[0]
            };
        }
        catch (error) {
            console.error('Error getting event by ID:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    // Delete event
    static async deleteEvent(id) {
        const client = await database_1.default.connect();
        try {
            const result = await client.query('DELETE FROM events WHERE id = $1', [id]);
            return result.rowCount !== null && result.rowCount > 0;
        }
        catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.EventService = EventService;
//# sourceMappingURL=eventService.js.map
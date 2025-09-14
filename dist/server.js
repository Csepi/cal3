"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const eventService_1 = require("./services/eventService");
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files from the root directory (for frontend files)
app.use(express_1.default.static(path_1.default.join(__dirname, '..')));
// CORS middleware for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    }
    else {
        next();
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'calendar-mvp-backend'
    });
});
// API Routes
// GET /events - Get all events
app.get('/events', async (req, res) => {
    try {
        const events = await eventService_1.EventService.getAllEvents();
        res.json(events);
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            error: 'Failed to fetch events',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// POST /events - Create new event
app.post('/events', async (req, res) => {
    try {
        const { title, date } = req.body;
        // Validation
        if (!title || !date) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Title and date are required'
            });
        }
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                error: 'Invalid date format',
                message: 'Date must be in YYYY-MM-DD format'
            });
        }
        const event = await eventService_1.EventService.createEvent({ title, date });
        res.status(201).json(event);
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            error: 'Failed to create event',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /events/:id - Get event by ID
app.get('/events/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid event ID',
                message: 'Event ID must be a number'
            });
        }
        const event = await eventService_1.EventService.getEventById(id);
        if (!event) {
            return res.status(404).json({
                error: 'Event not found',
                message: `Event with ID ${id} does not exist`
            });
        }
        res.json(event);
    }
    catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            error: 'Failed to fetch event',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// DELETE /events/:id - Delete event
app.delete('/events/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                error: 'Invalid event ID',
                message: 'Event ID must be a number'
            });
        }
        const deleted = await eventService_1.EventService.deleteEvent(id);
        if (!deleted) {
            return res.status(404).json({
                error: 'Event not found',
                message: `Event with ID ${id} does not exist`
            });
        }
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({
            error: 'Failed to delete event',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Serve the frontend for all other routes (SPA behavior)
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'index.html'));
});
// Initialize database and start server
const startServer = async () => {
    try {
        console.log('🚀 Starting Calendar MVP Backend...');
        // Test database connection
        const dbConnected = await (0, database_1.testConnection)();
        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Exiting...');
            process.exit(1);
        }
        // Initialize database schema
        await (0, database_1.initializeDatabase)();
        // Start the server
        app.listen(port, () => {
            console.log(`✅ Calendar MVP Backend server running on port ${port}`);
            console.log(`🌐 Health check: http://localhost:${port}/health`);
            console.log(`📅 Events API: http://localhost:${port}/events`);
            console.log(`🖥️ Frontend: http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map
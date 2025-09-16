// Calendar MVP JavaScript
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = [];
        this.apiBaseUrl = window.location.origin;
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadEventsFromAPI();
        this.renderCalendar();
        this.updateMonthDisplay();
    }

    bindEvents() {
        document.getElementById('prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
            this.updateMonthDisplay();
        });

        document.getElementById('next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
            this.updateMonthDisplay();
        });

        document.getElementById('add-event-btn').addEventListener('click', () => {
            this.showAddEventDialog();
        });
    }

    updateMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthDisplay = document.getElementById('current-month');
        monthDisplay.textContent = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
    }

    renderCalendar() {
        const calendarGrid = document.getElementById('calendar-grid');
        calendarGrid.innerHTML = '';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Get first day of month and number of days
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        // Generate calendar days
        const today = new Date();
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';

            if (date.getMonth() !== this.currentDate.getMonth()) {
                dayElement.classList.add('other-month');
            }

            if (this.isSameDay(date, today)) {
                dayElement.classList.add('today');
            }

            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = date.getDate();
            dayElement.appendChild(dayNumber);

            // Check for events on this date and add event indicators
            const dateStr = this.formatDateString(date);
            const dayEvents = this.events.filter(event =>
                this.formatDateString(event.date) === dateStr
            );

            if (dayEvents.length > 0) {
                dayElement.classList.add('has-events');

                // Add event indicators
                const eventIndicators = document.createElement('div');
                eventIndicators.className = 'event-indicators';

                dayEvents.slice(0, 3).forEach(event => { // Show max 3 event dots
                    const indicator = document.createElement('div');
                    indicator.className = 'event-dot';
                    indicator.title = event.title;
                    eventIndicators.appendChild(indicator);
                });

                if (dayEvents.length > 3) {
                    const moreIndicator = document.createElement('div');
                    moreIndicator.className = 'event-more';
                    moreIndicator.textContent = `+${dayEvents.length - 3}`;
                    moreIndicator.title = `${dayEvents.length - 3} more events`;
                    eventIndicators.appendChild(moreIndicator);
                }

                dayElement.appendChild(eventIndicators);
            }

            // Add click event for date selection
            dayElement.addEventListener('click', () => {
                this.selectDate(date, dayEvents);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    formatDateString(date) {
        return date.toISOString().split('T')[0];
    }

    selectDate(date, dayEvents = []) {
        this.selectedDate = date;
        console.log('Selected date:', date.toDateString());

        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current date
        event.target.closest('.calendar-day').classList.add('selected');

        // Show events for selected date
        this.showDayEvents(date, dayEvents);
    }

    showDayEvents(date, dayEvents) {
        if (dayEvents.length > 0) {
            console.log(`📅 Events for ${date.toDateString()}:`, dayEvents);
            // Could add a modal or detailed view here
            const eventTitles = dayEvents.map(e => e.title).join(', ');
            alert(`Events on ${date.toDateString()}:\n${eventTitles}`);
        } else {
            console.log(`📅 No events on ${date.toDateString()}`);
        }
    }

    showAddEventDialog() {
        const title = prompt('Enter event title:');
        if (title) {
            const dateStr = prompt('Enter event date (YYYY-MM-DD):');
            if (dateStr) {
                this.addEventToAPI(title, dateStr);
            }
        }
    }

    // Load events from backend API
    async loadEventsFromAPI() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/events`);
            if (response.ok) {
                const events = await response.json();
                this.events = events.map(event => ({
                    ...event,
                    date: new Date(event.date)
                }));
                this.renderEvents();
                console.log('✅ Events loaded from API:', events.length);
            } else {
                console.error('Failed to load events:', response.statusText);
                this.loadEventsFromLocalStorage(); // Fallback to localStorage
            }
        } catch (error) {
            console.error('Error loading events from API:', error);
            this.loadEventsFromLocalStorage(); // Fallback to localStorage
        }
    }

    // Add event via backend API
    async addEventToAPI(title, dateStr) {
        try {
            // Validate date format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(dateStr)) {
                alert('Invalid date format. Please use YYYY-MM-DD.');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title,
                    date: dateStr
                })
            });

            if (response.ok) {
                const newEvent = await response.json();
                console.log('✅ Event created:', newEvent);
                // Reload events from API to get updated list
                await this.loadEventsFromAPI();
                this.renderCalendar(); // Re-render calendar to show new event indicators
            } else {
                const errorData = await response.json();
                alert(`Failed to create event: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Failed to create event. Please try again.');
        }
    }

    // Fallback to localStorage (for offline functionality)
    loadEventsFromLocalStorage() {
        const stored = localStorage.getItem('calendar-events');
        if (stored) {
            this.events = JSON.parse(stored).map(event => ({
                ...event,
                date: new Date(event.date)
            }));
            this.renderEvents();
        }
    }

    // Legacy method for backward compatibility
    addEvent(title, dateStr) {
        this.addEventToAPI(title, dateStr);
    }

    loadEvents() {
        // This is now handled by loadEventsFromAPI in init()
        return;
    }

    renderEvents() {
        const eventsContainer = document.getElementById('events-container');

        if (this.events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="event-placeholder">
                    <p>No events scheduled</p>
                    <p class="placeholder-text">Click "Add Event" to create your first event</p>
                </div>
            `;
            return;
        }

        // Sort events by date
        const sortedEvents = [...this.events].sort((a, b) => a.date - b.date);

        eventsContainer.innerHTML = sortedEvents.map(event => `
            <div class="event-item" data-id="${event.id}">
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${event.date.toLocaleDateString()}</div>
                </div>
                <button class="delete-event-btn" onclick="calendar.deleteEventFromAPI(${event.id})" title="Delete Event">×</button>
            </div>
        `).join('');
    }

    // Delete event via API
    async deleteEventFromAPI(eventId) {
        try {
            if (!confirm('Are you sure you want to delete this event?')) {
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/api/events/${eventId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('✅ Event deleted:', eventId);
                // Reload events from API to get updated list
                await this.loadEventsFromAPI();
                this.renderCalendar(); // Re-render calendar to update event indicators
            } else {
                const errorData = await response.json();
                alert(`Failed to delete event: ${errorData.message || response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Failed to delete event. Please try again.');
        }
    }

    // Legacy method for backward compatibility
    deleteEvent(eventId) {
        this.deleteEventFromAPI(eventId);
    }
}

// Global calendar instance
let calendar;

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    calendar = new Calendar();

    console.log('📅 Calendar MVP with Backend Integration initialized successfully!');
    console.log('🌐 Connected to API at:', calendar.apiBaseUrl);
});

// Add some sample functionality for demonstration
window.addSampleEvents = async function() {
    if (calendar) {
        await calendar.addEventToAPI('Team Meeting', '2025-09-15');
        await calendar.addEventToAPI('Project Deadline', '2025-09-20');
        await calendar.addEventToAPI('Client Call', '2025-09-25');
    }
};
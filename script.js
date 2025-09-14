// Calendar MVP JavaScript
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = [];
        this.init();
    }

    init() {
        this.bindEvents();
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

            // Add click event for date selection
            dayElement.addEventListener('click', () => {
                this.selectDate(date);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    selectDate(date) {
        this.selectedDate = date;
        console.log('Selected date:', date.toDateString());

        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Add selection to current date (simplified for MVP)
        event.target.closest('.calendar-day').classList.add('selected');
    }

    showAddEventDialog() {
        const title = prompt('Enter event title:');
        if (title) {
            const dateStr = prompt('Enter event date (YYYY-MM-DD):');
            if (dateStr) {
                this.addEvent(title, dateStr);
            }
        }
    }

    addEvent(title, dateStr) {
        try {
            const eventDate = new Date(dateStr);
            const event = {
                id: Date.now(),
                title: title,
                date: eventDate
            };

            this.events.push(event);
            this.renderEvents();

            // Store in localStorage for persistence
            localStorage.setItem('calendar-events', JSON.stringify(this.events));
        } catch (error) {
            alert('Invalid date format. Please use YYYY-MM-DD.');
        }
    }

    loadEvents() {
        const stored = localStorage.getItem('calendar-events');
        if (stored) {
            this.events = JSON.parse(stored).map(event => ({
                ...event,
                date: new Date(event.date)
            }));
        }
    }

    renderEvents() {
        const eventsContainer = document.getElementById('events-container');

        if (this.events.length === 0) {
            eventsContainer.innerHTML = `
                <div class="event-placeholder">
                    <p>No events scheduled</p>
                    <p class="placeholder-text">Events will appear here when you add them</p>
                </div>
            `;
            return;
        }

        // Sort events by date
        const sortedEvents = [...this.events].sort((a, b) => a.date - b.date);

        eventsContainer.innerHTML = sortedEvents.map(event => `
            <div class="event-item" data-id="${event.id}">
                <div class="event-title">${event.title}</div>
                <div class="event-date">${event.date.toLocaleDateString()}</div>
            </div>
        `).join('');
    }

    deleteEvent(eventId) {
        this.events = this.events.filter(event => event.id !== eventId);
        this.renderEvents();
        localStorage.setItem('calendar-events', JSON.stringify(this.events));
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const calendar = new Calendar();
    calendar.loadEvents();
    calendar.renderEvents();

    console.log('Calendar MVP initialized successfully!');
});

// Add some sample functionality for demonstration
window.addSampleEvents = function() {
    const calendar = new Calendar();
    calendar.addEvent('Team Meeting', '2024-01-15');
    calendar.addEvent('Project Deadline', '2024-01-20');
    calendar.addEvent('Client Call', '2024-01-25');
};
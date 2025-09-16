const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = 8081;
const JWT_SECRET = 'calendar-secret-key';

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// In-memory database
let users = [];
let calendars = [];
let events = [];
let calendarShares = [];
let nextId = 1;

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper functions
const generateToken = (user) => {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Routes

// Auth endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await hashPassword(password);
    const user = {
      id: nextId++,
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(user);

    // Create default calendar
    const defaultCalendar = {
      id: nextId++,
      name: `${firstName}'s Calendar`,
      description: 'My personal calendar',
      color: '#3b82f6',
      visibility: 'PRIVATE',
      ownerId: user.id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    calendars.push(defaultCalendar);

    const token = generateToken(user);
    const { password: _, ...userResponse } = user;

    res.status(201).json({
      access_token: token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.isActive);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const { password: _, ...userResponse } = user;

    res.json({
      access_token: token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// User endpoints
app.get('/api/users', authenticateToken, (req, res) => {
  const { search } = req.query;
  let result = users.filter(u => u.isActive && u.id !== req.user.sub);

  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(u =>
      u.username.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.firstName.toLowerCase().includes(searchLower) ||
      u.lastName.toLowerCase().includes(searchLower)
    );
  }

  const response = result.slice(0, 20).map(({ password, ...user }) => user);
  res.json(response);
});

app.get('/api/users/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const { password, ...userResponse } = user;
  res.json(userResponse);
});

// Calendar endpoints
app.get('/api/calendars', authenticateToken, (req, res) => {
  const userId = req.user.sub;

  // Get owned calendars
  const ownedCalendars = calendars.filter(c => c.ownerId === userId && c.isActive);

  // Get shared calendars
  const sharedCalendarIds = calendarShares
    .filter(cs => cs.userId === userId)
    .map(cs => cs.calendarId);
  const sharedCalendars = calendars.filter(c => sharedCalendarIds.includes(c.id) && c.isActive);

  const allCalendars = [...ownedCalendars, ...sharedCalendars];

  // Add owner info
  const response = allCalendars.map(calendar => {
    const owner = users.find(u => u.id === calendar.ownerId);
    return {
      ...calendar,
      owner: owner ? {
        id: owner.id,
        username: owner.username,
        firstName: owner.firstName,
        lastName: owner.lastName
      } : null
    };
  });

  res.json(response);
});

app.post('/api/calendars', authenticateToken, (req, res) => {
  const { name, description, color = '#3b82f6', visibility = 'PRIVATE' } = req.body;

  const calendar = {
    id: nextId++,
    name,
    description,
    color,
    visibility,
    ownerId: req.user.sub,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  calendars.push(calendar);
  res.status(201).json(calendar);
});

app.get('/api/calendars/:id', authenticateToken, (req, res) => {
  const calendarId = parseInt(req.params.id);
  const userId = req.user.sub;

  const calendar = calendars.find(c => c.id === calendarId && c.isActive);
  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  // Check access
  const hasAccess = calendar.ownerId === userId ||
    calendarShares.some(cs => cs.calendarId === calendarId && cs.userId === userId);

  if (!hasAccess) {
    return res.status(403).json({ message: 'Access denied' });
  }

  // Add owner and shared users info
  const owner = users.find(u => u.id === calendar.ownerId);
  const sharedUserIds = calendarShares
    .filter(cs => cs.calendarId === calendarId)
    .map(cs => cs.userId);
  const sharedUsers = users.filter(u => sharedUserIds.includes(u.id));

  const response = {
    ...calendar,
    owner: owner ? {
      id: owner.id,
      username: owner.username,
      firstName: owner.firstName,
      lastName: owner.lastName
    } : null,
    sharedWith: sharedUsers.map(({ password, ...user }) => user)
  };

  res.json(response);
});

app.post('/api/calendars/:id/share', authenticateToken, (req, res) => {
  const calendarId = parseInt(req.params.id);
  const { userIds, permission = 'READ' } = req.body;
  const userId = req.user.sub;

  const calendar = calendars.find(c => c.id === calendarId && c.isActive);
  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  if (calendar.ownerId !== userId) {
    return res.status(403).json({ message: 'Only owner can share calendar' });
  }

  // Remove existing shares for these users
  calendarShares = calendarShares.filter(cs =>
    !(cs.calendarId === calendarId && userIds.includes(cs.userId))
  );

  // Add new shares
  userIds.forEach(uid => {
    calendarShares.push({
      id: nextId++,
      calendarId,
      userId: uid,
      permission,
      createdAt: new Date()
    });
  });

  res.json({ message: 'Calendar shared successfully' });
});

// Event endpoints
app.get('/api/events', authenticateToken, (req, res) => {
  const userId = req.user.sub;
  const { startDate, endDate } = req.query;

  // Get accessible calendar IDs
  const ownedCalendarIds = calendars
    .filter(c => c.ownerId === userId && c.isActive)
    .map(c => c.id);
  const sharedCalendarIds = calendarShares
    .filter(cs => cs.userId === userId)
    .map(cs => cs.calendarId);
  const accessibleCalendarIds = [...ownedCalendarIds, ...sharedCalendarIds];

  let result = events.filter(e => accessibleCalendarIds.includes(e.calendarId));

  // Apply date filters
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    result = result.filter(e => {
      const eventDate = new Date(e.startDate);
      return eventDate >= start && eventDate <= end;
    });
  }

  // Add calendar and creator info
  const response = result.map(event => {
    const calendar = calendars.find(c => c.id === event.calendarId);
    const creator = users.find(u => u.id === event.createdById);
    return {
      ...event,
      calendar: calendar ? {
        id: calendar.id,
        name: calendar.name,
        color: calendar.color
      } : null,
      createdBy: creator ? {
        id: creator.id,
        username: creator.username,
        firstName: creator.firstName,
        lastName: creator.lastName
      } : null
    };
  });

  res.json(response);
});

app.post('/api/events', authenticateToken, (req, res) => {
  const { calendarId, title, description, startDate, endDate, location, allDay = false } = req.body;
  const userId = req.user.sub;

  const calendar = calendars.find(c => c.id === calendarId && c.isActive);
  if (!calendar) {
    return res.status(404).json({ message: 'Calendar not found' });
  }

  // Check write access
  const hasWriteAccess = calendar.ownerId === userId ||
    calendarShares.some(cs =>
      cs.calendarId === calendarId && cs.userId === userId &&
      ['WRITE', 'ADMIN'].includes(cs.permission)
    );

  if (!hasWriteAccess) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const event = {
    id: nextId++,
    calendarId,
    title,
    description,
    startDate: new Date(startDate),
    endDate: endDate ? new Date(endDate) : null,
    location,
    allDay,
    createdById: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  events.push(event);
  res.status(201).json(event);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Calendar Sharing API',
    status: 'running',
    version: '1.0.1',
    message: 'NestJS Calendar API Test Server',
    database: 'in-memory',
    baseUrl: `http://localhost:${port}/api`,
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      auth: '/api/auth/*',
      users: '/api/users/*',
      calendars: '/api/calendars/*',
      events: '/api/events/*'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'NestJS Calendar API Test Server',
    version: '1.0.1',
    database: 'in-memory',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      calendars: '/api/calendars/*',
      events: '/api/events/*',
      docs: 'See API_DOCUMENTATION.md'
    }
  });
});

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Calendar Sharing API',
    description: 'A comprehensive calendar sharing application with multi-user support',
    version: '1.0.0',
    baseUrl: `http://localhost:${port}/api`,
    documentation: 'See API_DOCUMENTATION.md for complete documentation',
    testEndpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      users: 'GET /api/users (requires auth)',
      calendars: 'GET /api/calendars (requires auth)',
      events: 'GET /api/events (requires auth)'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Calendar API Test Server running on: http://localhost:${port}`);
  console.log(`📚 API Health Check: http://localhost:${port}/api/health`);
  console.log(`📖 API Docs: http://localhost:${port}/api/docs`);
  console.log(`📋 Complete Documentation: backend-nestjs/API_DOCUMENTATION.md`);
  console.log('');
  console.log('✅ Available Endpoints:');
  console.log('   POST /api/auth/register - Register new user');
  console.log('   POST /api/auth/login - Login user');
  console.log('   GET  /api/users - Search users (auth required)');
  console.log('   GET  /api/calendars - Get calendars (auth required)');
  console.log('   POST /api/calendars - Create calendar (auth required)');
  console.log('   GET  /api/events - Get events (auth required)');
  console.log('   POST /api/events - Create event (auth required)');
  console.log('');
  console.log('💡 The complete NestJS backend is available in the backend-nestjs/ folder');
  console.log('   and can be deployed to Azure with PostgreSQL database.');
});

// Sample data for testing
setTimeout(() => {
  // Add sample user
  const samplePassword = bcrypt.hashSync('password123', 12);
  const sampleUser = {
    id: nextId++,
    username: 'demo_user',
    email: 'demo@example.com',
    password: samplePassword,
    firstName: 'Demo',
    lastName: 'User',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  users.push(sampleUser);

  console.log('📝 Sample user created:');
  console.log('   Username: demo_user');
  console.log('   Password: password123');
  console.log('   Email: demo@example.com');
}, 1000);
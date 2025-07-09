const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = 8000;

// CORS configuration - only allow App 1 (port 3000)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from App 1 only
    const allowedOrigins = ['http://localhost:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy. Only App 1 (port 3000) is authorized.'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Express server is running'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API call successful from backend server',
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'unknown',
    userAgent: req.get('user-agent')
  });
});

// Tickets endpoints for testing templates
app.get('/api/tickets', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: 'Test Ticket 1', status: 'open' },
      { id: 2, title: 'Test Ticket 2', status: 'closed' }
    ],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/tickets', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 123,
      title: req.body.title || 'New Ticket',
      status: 'open',
      created: new Date().toISOString()
    },
    message: 'Ticket created successfully'
  });
});

// Users endpoint for testing
app.get('/api/users/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.params.id,
      name: `User ${req.params.id}`,
      email: `user${req.params.id}@example.com`
    },
    timestamp: new Date().toISOString()
  });
});

// Data submission endpoint
app.post('/api/data', (req, res) => {
  res.json({
    success: true,
    message: 'Data received successfully',
    receivedData: req.body,
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'unknown'
  });
});

// Users list endpoint
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ],
    total: 3,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Express server is running on port ${PORT}`);
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`🔒 CORS Policy: Only allows requests from http://localhost:3000`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/test - Test endpoint`);
  console.log(`   GET  /api/tickets - Get tickets`);
  console.log(`   POST /api/tickets - Create ticket`);
  console.log(`   GET  /api/users - Get users list`);
  console.log(`   GET  /api/users/:id - Get user by ID`);
  console.log(`   POST /api/data - Submit data`);
  console.log(`✅ Server ready to handle requests!`);
}); 
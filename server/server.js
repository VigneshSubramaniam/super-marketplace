const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = 8000;

// CORS configuration - allow App 1 (port 3000) and API Gateway (port 9000)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from App 1 directly and API Gateway for proxied requests
    const allowedOrigins = [
      'http://localhost:3000',  // App 1 - direct access
      'http://localhost:9000'   // API Gateway - for App 2 proxied requests
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy. Only App 1 (direct) and API Gateway (proxied) are authorized.'));
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

// Sample API endpoints
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API call successful from App 1!',
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'unknown'
  });
});

app.post('/api/data', (req, res) => {
  const { message } = req.body;
  res.json({
    success: true,
    message: 'Data received successfully',
    receivedData: message,
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'unknown'
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ],
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'unknown'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error.message.includes('CORS')) {
    res.status(403).json({
      success: false,
      error: 'CORS Error',
      message: 'Access denied. Only App 1 (direct) and API Gateway (proxied) are authorized to access this API.',
      origin: req.get('origin') || 'unknown'
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'API endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS enabled for:`);
  console.log(`   - http://localhost:3000 (App 1 - Direct Access)`);
  console.log(`   - http://localhost:9000 (API Gateway - Proxied Access)`);
  console.log(`❌ CORS blocked for: http://localhost:3001 (App 2 - Must use Gateway)`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /api/test - Test endpoint`);
  console.log(`   POST /api/data - Data submission`);
  console.log(`   GET  /api/users - Get users list`);
}); 
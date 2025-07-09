require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const EnvironmentConfig = require('../config/environment');
const DynamicCorsHandler = require('./cors');
const ApiProxyHandler = require('./proxy');
const AuthMiddleware = require('./auth');

class ApiGatewayServer {
  constructor() {
    this.config = EnvironmentConfig.getConfig();
    this.app = express();
    this.corsHandler = new DynamicCorsHandler(this.config);
    this.proxyHandler = new ApiProxyHandler(this.config);
    this.authMiddleware = new AuthMiddleware(this.corsHandler);
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false
    }));

    // Logging middleware
    this.app.use(morgan('combined'));

    // CORS middleware
    this.app.use(cors(this.corsHandler.getCorsOptions()));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Trust proxy for rate limiting
    this.app.set('trust proxy', 1);

    // Authentication middleware
    this.app.use(this.authMiddleware.authenticate.bind(this.authMiddleware));

    // Rate limiting middleware
    this.app.use(this.authMiddleware.rateLimit(15 * 60 * 1000, 1000)); // 1000 requests per 15 minutes

    // Request logging middleware
    this.app.use(this.authMiddleware.logAuthenticatedRequest.bind(this.authMiddleware));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'API Gateway SDK',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        port: this.config.gatewayPort,
        backendUrl: this.config.backendUrl
      });
    });

    // Gateway management endpoints
    this.app.get('/gateway/info', (req, res) => {
      res.json({
        success: true,
        gateway: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          backendUrl: this.config.backendUrl,
          allowedOrigins: this.config.allowedOrigins,
          domainPatterns: this.config.domainPatterns
        },
        registeredDomains: this.corsHandler.getRegisteredDomains(),
        stats: this.proxyHandler.getStats()
      });
    });

    this.app.get('/gateway/stats', (req, res) => {
      res.json({
        success: true,
        stats: this.proxyHandler.getStats(),
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/gateway/logs', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json({
        success: true,
        logs: this.proxyHandler.getRecentLogs(limit),
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/gateway/domains', (req, res) => {
      res.json({
        success: true,
        configuredOrigins: this.config.allowedOrigins,
        domainPatterns: this.config.domainPatterns,
        registeredDomains: this.corsHandler.getRegisteredDomains(),
        timestamp: new Date().toISOString()
      });
    });

    // Domain registration endpoint
    this.app.post('/gateway/register-domain', (req, res) => {
      const { domain, apiKey, metadata } = req.body;

      if (!domain || !apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Domain and API key are required'
        });
      }

      const registered = this.corsHandler.registerDomain(domain, apiKey, metadata);
      
      if (registered) {
        res.json({
          success: true,
          message: 'Domain registered successfully',
          domain,
          appName: this.corsHandler.getApiKeyInfo(apiKey),
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(401).json({
          success: false,
          error: 'Invalid API Key',
          message: 'The provided API key is not valid'
        });
      }
    });

    // API key generation endpoint (for development)
    this.app.post('/gateway/generate-key', (req, res) => {
      if (!EnvironmentConfig.isDevelopment()) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Key generation is only available in development mode'
        });
      }

      const { prefix, description } = req.body;
      const apiKey = AuthMiddleware.generateApiKey(prefix);
      
      res.json({
        success: true,
        apiKey,
        description: description || 'Generated API key',
        timestamp: new Date().toISOString(),
        note: 'This key is for development use only'
      });
    });

    // Proxy all API requests to backend
    this.app.use('/api*', (req, res) => {
      this.proxyHandler.proxyRequest(req, res);
    });

    // Catch all other routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'API endpoint not found',
        availableEndpoints: [
          'GET /health',
          'GET /gateway/info',
          'GET /gateway/stats',
          'GET /gateway/logs',
          'GET /gateway/domains',
          'POST /gateway/register-domain',
          'POST /gateway/generate-key (dev only)',
          'ALL /api* (proxied to backend)'
        ]
      });
    });

    // Error handling middleware
    this.app.use((error, req, res, next) => {
      console.error('Gateway Error:', error);
      
      if (error.message.includes('CORS')) {
        res.status(403).json({
          success: false,
          error: 'CORS Error',
          message: error.message,
          origin: req.get('origin') || 'unknown'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  start() {
    const port = this.config.gatewayPort;
    
    this.app.listen(port, () => {
      console.log('\n🚀 API Gateway SDK Server Started');
      console.log(`📡 Gateway URL: ${this.config.gatewayUrl}`);
      console.log(`🔗 Backend URL: ${this.config.backendUrl}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('\n✅ Allowed Origins:');
      this.config.allowedOrigins.forEach(origin => {
        console.log(`   - ${origin}`);
      });
      console.log('\n🎯 Domain Patterns:');
      this.config.domainPatterns.forEach(pattern => {
        console.log(`   - ${pattern}`);
      });
      console.log('\n📋 Available Endpoints:');
      console.log('   GET  /health - Health check');
      console.log('   GET  /gateway/info - Gateway information');
      console.log('   GET  /gateway/stats - Request statistics');
      console.log('   GET  /gateway/logs - Recent request logs');
      console.log('   GET  /gateway/domains - Domain configuration');
      console.log('   POST /gateway/register-domain - Register new domain');
      console.log('   POST /gateway/generate-key - Generate API key (dev only)');
      console.log('   ALL  /api* - Proxy to backend');
      console.log(`\n🔑 Configured API Keys: ${Object.keys(this.config.apiKeys).length}`);
      console.log('\n📊 Gateway is ready to handle requests!');
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const gateway = new ApiGatewayServer();
  gateway.start();
}

module.exports = ApiGatewayServer; 
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const EnvironmentConfig = require('../config/environment');
const RequestTemplateManager = require('../core/RequestTemplateManager');

class APIGatewayServer {
  constructor() {
    this.app = express();
    this.config = EnvironmentConfig.getConfig();
    this.templateManager = new RequestTemplateManager();
    this.requestStats = {
      totalRequests: 0,
      templateRequests: 0,
      proxyRequests: 0,
      errors: 0
    };
    this.requestLogs = [];
    this.buildClientLibrary();
    this.setupMiddleware();
    this.setupRoutes();
  }

  buildClientLibrary() {
    try {
      const buildScript = path.join(__dirname, '../..', 'build-client.js');
      execSync(`node ${buildScript}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('⚠️  Failed to build client library:', error.message);
    }
  }

  setupMiddleware() {
    // Security middleware with relaxed CORS for client library
    this.app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
    }));
    
    // Logging middleware
    this.app.use(morgan('combined', {
      stream: {
        write: (message) => {
          this.requestLogs.push({
            timestamp: new Date().toISOString(),
            message: message.trim()
          });
          // Keep only last 100 logs
          if (this.requestLogs.length > 100) {
            this.requestLogs.shift();
          }
        }
      }
    }));

    // CORS middleware
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || this.isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files (client library) with special CORS headers
    const publicDir = path.join(__dirname, '../..', 'public');
    
    // Special route for client library with CORS headers
    this.app.get('/gateway-client.js', (req, res) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Content-Type', 'application/javascript; charset=UTF-8');
      res.sendFile(path.join(publicDir, 'gateway-client.js'));
    });
    
    // Serve other static files normally
    this.app.use(express.static(publicDir));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // Gateway information
    this.app.get('/gateway/info', (req, res) => {
      res.json({
        gatewayUrl: this.config.gatewayUrl,
        allowedOrigins: this.config.allowedOrigins,
        domainPatterns: this.config.domainPatterns,
        environment: process.env.NODE_ENV || 'development',
        templates: this.templateManager.listTemplates()
      });
    });

    // Request statistics
    this.app.get('/gateway/stats', (req, res) => {
      res.json({
        ...this.requestStats,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Request logs
    this.app.get('/gateway/logs', (req, res) => {
      res.json({
        logs: this.requestLogs,
        count: this.requestLogs.length
      });
    });

    // Template management
    this.app.get('/gateway/templates', (req, res) => {
      res.json(this.templateManager.listTemplates());
    });

    // Main request template endpoint - Freshworks style
    this.app.post('/gateway/invoke-template', async (req, res) => {
      const requestId = uuidv4();
      const startTime = Date.now();
      
      try {
        const { templateName, context, body } = req.body;
        
        if (!templateName) {
          return res.status(400).json({
            error: 'Template name is required',
            requestId
          });
        }

        console.log(`🔄 [${requestId}] Invoking template: ${templateName}`);
        this.requestStats.templateRequests++;
        this.requestStats.totalRequests++;

        // Process template
        const processedTemplate = this.templateManager.processTemplate(templateName, context, body);
        
        // Build request URL
        const protocol = processedTemplate.protocol || 'https';
        const url = `${protocol}://${processedTemplate.host}${processedTemplate.path || ''}`;
        
        // Make HTTP request
        const axiosConfig = {
          method: processedTemplate.method.toLowerCase(),
          url,
          headers: processedTemplate.headers || {},
          timeout: 30000
        };

        if (processedTemplate.body) {
          axiosConfig.data = processedTemplate.body;
        }

        console.log(`📡 [${requestId}] Making request to: ${url}`);
        const response = await axios(axiosConfig);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] Response: ${response.status} (${duration}ms)`);

        res.json({
          success: true,
          requestId,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          duration
        });

      } catch (error) {
        const duration = Date.now() - startTime;
        this.requestStats.errors++;
        
        console.error(`❌ [${requestId}] Error: ${error.message} (${duration}ms)`);
        
        if (error.response) {
          // HTTP error response
          res.status(error.response.status).json({
            success: false,
            requestId,
            error: error.message,
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            duration
          });
        } else {
          // Other errors (network, template validation, etc.)
          res.status(500).json({
            success: false,
            requestId,
            error: error.message,
            duration
          });
        }
      }
    });

    // Legacy proxy endpoint (for backward compatibility)
    this.app.all('/api/*', async (req, res) => {
      const requestId = uuidv4();
      const startTime = Date.now();
      
      try {
        console.log(`🔄 [${requestId}] Proxying ${req.method} ${req.originalUrl} to ${this.config.backendUrl}`);
        this.requestStats.proxyRequests++;
        this.requestStats.totalRequests++;

        const targetUrl = `${this.config.backendUrl}${req.originalUrl.replace('/api', '')}`;
        
        const axiosConfig = {
          method: req.method.toLowerCase(),
          url: targetUrl,
          headers: { ...req.headers },
          timeout: 30000
        };

        // Remove host header to avoid conflicts
        delete axiosConfig.headers.host;

        if (req.body && Object.keys(req.body).length > 0) {
          axiosConfig.data = req.body;
        }

        const response = await axios(axiosConfig);
        
        const duration = Date.now() - startTime;
        console.log(`✅ [${requestId}] Response: ${response.status} (${duration}ms)`);

        res.status(response.status).json(response.data);

      } catch (error) {
        const duration = Date.now() - startTime;
        this.requestStats.errors++;
        
        console.error(`❌ [${requestId}] Error: ${error.message} (${duration}ms)`);
        
        if (error.response) {
          res.status(error.response.status).json(error.response.data);
        } else {
          res.status(500).json({
            error: 'Gateway error',
            message: error.message,
            requestId
          });
        }
      }
    });
  }

  isOriginAllowed(origin) {
    // Check exact matches
    if (this.config.allowedOrigins.includes(origin)) {
      return true;
    }

    // Check domain patterns
    return this.config.domainPatterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(origin);
    });
  }

  start() {
    this.app.listen(this.config.gatewayPort, () => {
      console.log('🚀 API Gateway SDK Server Started');
      console.log(`📡 Gateway URL: ${this.config.gatewayUrl}`);
      console.log(`🔗 Backend URL: ${this.config.backendUrl}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('✅ Allowed Origins:');
      this.config.allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
      console.log('🎯 Domain Patterns:');
      this.config.domainPatterns.forEach(pattern => console.log(`   - ${pattern}`));
      console.log('📋 Available Endpoints:');
      console.log('   GET  /health - Health check');
      console.log('   GET  /gateway/info - Gateway information');
      console.log('   GET  /gateway/stats - Request statistics');
      console.log('   GET  /gateway/logs - Recent request logs');
      console.log('   GET  /gateway/templates - Template configuration');
      console.log('   POST /gateway/invoke-template - Invoke request template');
      console.log('   GET  /gateway-client.js - Client library');
      console.log('   ALL  /api* - Proxy to backend');
      console.log(`🔑 Configured API Keys: ${Object.keys(this.config.apiKeys).length}`);
      console.log('📊 Gateway is ready to handle requests!');
    });
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new APIGatewayServer();
  server.start();
}

module.exports = APIGatewayServer; 
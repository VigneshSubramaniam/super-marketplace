const fetch = require('node-fetch');

class ApiProxyHandler {
  constructor(config) {
    this.config = config;
    this.backendUrl = config.backendUrl;
    this.requestCount = 0;
    this.requestLog = [];
  }

  // Main proxy method
  async proxyRequest(req, res) {
    this.requestCount++;
    const requestId = `req-${this.requestCount}-${Date.now()}`;
    
    try {
      const startTime = Date.now();
      
      // Build backend URL
      const backendUrl = `${this.backendUrl}${req.path}`;
      
      // Prepare headers for backend
      const backendHeaders = this.prepareHeaders(req);
      
      // Prepare request options
      const requestOptions = {
        method: req.method,
        headers: backendHeaders
      };

      // Add body for non-GET requests
      if (req.method !== 'GET' && req.body) {
        requestOptions.body = JSON.stringify(req.body);
      }

      console.log(`🔄 [${requestId}] Proxying ${req.method} ${req.path} to ${backendUrl}`);
      console.log(`📍 Origin: ${req.get('origin')} | API Key: ${req.headers['x-api-key']}`);

      // Make request to backend
      const response = await fetch(backendUrl, requestOptions);
      const responseData = await response.text();
      
      // Parse JSON if possible
      let jsonData;
      try {
        jsonData = JSON.parse(responseData);
      } catch (e) {
        jsonData = { data: responseData };
      }

      const duration = Date.now() - startTime;
      
      // Log request
      this.logRequest({
        requestId,
        method: req.method,
        path: req.path,
        origin: req.get('origin'),
        apiKey: req.headers['x-api-key'],
        status: response.status,
        duration,
        timestamp: new Date().toISOString()
      });

      // Forward response
      res.status(response.status);
      
      // Forward response headers
      response.headers.forEach((value, name) => {
        // Skip certain headers
        if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(name.toLowerCase())) {
          res.set(name, value);
        }
      });

      // Add gateway headers
      res.set('X-Gateway-Request-ID', requestId);
      res.set('X-Gateway-Duration', `${duration}ms`);
      res.set('X-Proxied-From', this.backendUrl);

      console.log(`✅ [${requestId}] Response: ${response.status} (${duration}ms)`);
      
      res.json(jsonData);

    } catch (error) {
      console.error(`❌ [${requestId}] Proxy error:`, error.message);
      
      this.logRequest({
        requestId,
        method: req.method,
        path: req.path,
        origin: req.get('origin'),
        apiKey: req.headers['x-api-key'],
        status: 500,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: 'Gateway Proxy Error',
        message: 'Failed to proxy request to backend',
        requestId,
        details: error.message
      });
    }
  }

  // Prepare headers for backend request
  prepareHeaders(req) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'API-Gateway-SDK/1.0.0',
      'X-Forwarded-For': req.ip,
      'X-Forwarded-Proto': req.protocol,
      'X-Forwarded-Host': req.get('host'),
      'X-Gateway-Origin': req.get('origin') || 'unknown',
      'X-Gateway-API-Key': req.headers['x-api-key'] || 'none',
      'X-Gateway-Client-Domain': req.headers['x-client-domain'] || req.get('origin') || 'unknown'
    };

    // Forward authorization header if present
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    // Forward custom headers
    Object.keys(req.headers).forEach(key => {
      if (key.startsWith('x-custom-')) {
        headers[key] = req.headers[key];
      }
    });

    return headers;
  }

  // Log request for analytics
  logRequest(logEntry) {
    this.requestLog.push(logEntry);
    
    // Keep only last 1000 requests in memory
    if (this.requestLog.length > 1000) {
      this.requestLog = this.requestLog.slice(-1000);
    }
  }

  // Get request statistics
  getStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentRequests = this.requestLog.filter(log => 
      new Date(log.timestamp).getTime() > oneHourAgo
    );

    const stats = {
      totalRequests: this.requestCount,
      recentRequests: recentRequests.length,
      averageResponseTime: 0,
      successRate: 0,
      topOrigins: {},
      topApiKeys: {},
      statusCodes: {}
    };

    if (recentRequests.length > 0) {
      // Calculate average response time
      const totalDuration = recentRequests
        .filter(log => log.duration)
        .reduce((sum, log) => sum + log.duration, 0);
      
      stats.averageResponseTime = Math.round(totalDuration / recentRequests.length);

      // Calculate success rate
      const successfulRequests = recentRequests.filter(log => log.status < 400).length;
      stats.successRate = Math.round((successfulRequests / recentRequests.length) * 100);

      // Top origins
      recentRequests.forEach(log => {
        const origin = log.origin || 'unknown';
        stats.topOrigins[origin] = (stats.topOrigins[origin] || 0) + 1;
      });

      // Top API keys
      recentRequests.forEach(log => {
        const apiKey = log.apiKey || 'none';
        stats.topApiKeys[apiKey] = (stats.topApiKeys[apiKey] || 0) + 1;
      });

      // Status codes
      recentRequests.forEach(log => {
        const status = log.status || 500;
        stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;
      });
    }

    return stats;
  }

  // Get recent request logs
  getRecentLogs(limit = 50) {
    return this.requestLog.slice(-limit).reverse();
  }
}

module.exports = ApiProxyHandler; 
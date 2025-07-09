/**
 * API Gateway SDK Client
 * Universal client for embedded applications to communicate with the API Gateway
 */

class ApiGatewaySDK {
  constructor(config = {}) {
    this.gatewayUrl = config.gatewayUrl || this.detectGatewayUrl();
    this.apiKey = config.apiKey || null;
    this.clientDomain = config.clientDomain || window.location.origin;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    
    // Event listeners for monitoring
    this.listeners = {
      request: [],
      response: [],
      error: []
    };

    // Initialize
    this.init();
  }

  // Auto-detect gateway URL based on environment
  detectGatewayUrl() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:9000';
    }
    
    // Production/staging detection
    if (hostname.includes('staging')) {
      return 'https://gateway-staging.company.com';
    }
    
    return 'https://gateway.company.com';
  }

  // Initialize SDK
  async init() {
    try {
      // Register domain if API key is provided
      if (this.apiKey) {
        await this.registerDomain();
      }
      
      // Test connectivity
      await this.healthCheck();
      
      console.log('✅ API Gateway SDK initialized successfully');
    } catch (error) {
      console.warn('⚠️ API Gateway SDK initialization failed:', error.message);
    }
  }

  // Register current domain with the gateway
  async registerDomain() {
    try {
      const response = await fetch(`${this.gatewayUrl}/gateway/register-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'X-Client-Domain': this.clientDomain
        },
        body: JSON.stringify({
          domain: this.clientDomain,
          apiKey: this.apiKey,
          metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            sdkVersion: '1.0.0'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔓 Domain registered with API Gateway:', data.domain);
        return data;
      } else {
        throw new Error(`Domain registration failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Domain registration error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.gatewayUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        console.log('💚 Gateway health check passed:', data.status);
        return data;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
      throw error;
    }
  }

  // Core request method with retry logic
  async request(endpoint, options = {}) {
    const url = `${this.gatewayUrl}/api${endpoint}`;
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Domain': this.clientDomain,
        'X-Request-ID': requestId,
        ...options.headers
      },
      timeout: this.timeout,
      ...options
    };

    // Add API key if available
    if (this.apiKey) {
      requestOptions.headers['X-API-Key'] = this.apiKey;
    }

    // Add body for non-GET requests
    if (options.body && requestOptions.method !== 'GET') {
      requestOptions.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    // Emit request event
    this.emit('request', { url, options: requestOptions, requestId });

    let lastError;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`🔄 [${requestId}] API request attempt ${attempt}: ${requestOptions.method} ${endpoint}`);
        
        const response = await this.fetchWithTimeout(url, requestOptions);
        const data = await response.json();

        if (response.ok) {
          console.log(`✅ [${requestId}] API request successful: ${response.status}`);
          
          // Emit response event
          this.emit('response', { 
            url, 
            response: data, 
            status: response.status, 
            requestId,
            attempt
          });
          
          return data;
        } else {
          throw new Error(`API request failed: ${response.status} - ${data.message || 'Unknown error'}`);
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ [${requestId}] API request attempt ${attempt} failed:`, error.message);
        
        // Don't retry on certain errors
        if (error.message.includes('401') || error.message.includes('403')) {
          break;
        }
        
        // Wait before retrying
        if (attempt < this.retryAttempts) {
          await this.sleep(this.retryDelay * attempt);
        }
      }
    }

    // Emit error event
    this.emit('error', { url, error: lastError, requestId });
    
    throw lastError;
  }

  // Fetch with timeout
  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Specific API methods
  async testConnection() {
    return this.get('/test');
  }

  async submitData(data) {
    return this.post('/data', { message: data });
  }

  async getUsers() {
    return this.get('/users');
  }

  // Event system
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event listener error:', error);
        }
      });
    }
  }

  // Utility methods
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Configuration methods
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    return this.registerDomain();
  }

  setGatewayUrl(url) {
    this.gatewayUrl = url;
  }

  setTimeout(timeout) {
    this.timeout = timeout;
  }

  setRetryOptions(attempts, delay) {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }

  // Debug methods
  async getGatewayInfo() {
    try {
      const response = await fetch(`${this.gatewayUrl}/gateway/info`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get gateway info:', error);
      return null;
    }
  }

  async getGatewayStats() {
    try {
      const response = await fetch(`${this.gatewayUrl}/gateway/stats`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get gateway stats:', error);
      return null;
    }
  }
}

// Export for different environments
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = ApiGatewaySDK;
} else {
  // Browser environment
  window.ApiGatewaySDK = ApiGatewaySDK;
}

// Auto-initialize if in browser and config is available
if (typeof window !== 'undefined' && window.API_GATEWAY_CONFIG) {
  window.apiGateway = new ApiGatewaySDK(window.API_GATEWAY_CONFIG);
} 
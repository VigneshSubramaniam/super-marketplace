
/* Super Marketplace Gateway Client Library */
(function() {
  'use strict';
  
  class GatewayClient {
  constructor(options = {}) {
    this.gatewayUrl = options.gatewayUrl || 'http://localhost:9000';
    this.apiKey = options.apiKey || null;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 2;
    this.debug = options.debug || false;
  }

  /**
   * Invoke a request template through the gateway
   * @param {string} templateName - Name of the template to invoke
   * @param {Object} options - Template invocation options
   * @param {Object} options.context - Context variables for template processing
   * @param {string|Object} options.body - Request body
   * @returns {Promise<Object>} - Response from the API
   */
  async invokeTemplate(templateName, options = {}) {
    const { context = {}, body = null } = options;
    
    if (!templateName) {
      throw new Error('Template name is required');
    }

    this.log('Invoking template:', templateName);
    
    const requestPayload = {
      templateName,
      context,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null
    };

    const response = await this.makeRequest('/gateway/invoke-template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.success) {
      throw new Error(`Template invocation failed: ${response.error}`);
    }

    return response;
  }

  /**
   * Get gateway information
   * @returns {Promise<Object>} - Gateway configuration and status
   */
  async getGatewayInfo() {
    return await this.makeRequest('/gateway/info');
  }

  /**
   * Get gateway statistics
   * @returns {Promise<Object>} - Gateway usage statistics
   */
  async getGatewayStats() {
    return await this.makeRequest('/gateway/stats');
  }

  /**
   * Get available templates
   * @returns {Promise<Object>} - Available request templates
   */
  async getTemplates() {
    return await this.makeRequest('/gateway/templates');
  }

  /**
   * Check gateway health
   * @returns {Promise<Object>} - Gateway health status
   */
  async checkHealth() {
    return await this.makeRequest('/health');
  }

  /**
   * Make HTTP request to the gateway
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} - Response data
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.gatewayUrl}${endpoint}`;
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-API-Key': this.apiKey })
      },
      credentials: 'include',
      ...options
    };

    let lastError;
    
    // Retry logic
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        this.log(`Making request to: ${url} (attempt ${attempt + 1})`);
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        this.log('Request successful:', data);
        return data;
        
      } catch (error) {
        lastError = error;
        this.log(`Request failed (attempt ${attempt + 1}):`, error.message);
        
        if (attempt < this.retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Log debug messages
   * @private
   * @param {...any} args - Arguments to log
   */
  log(...args) {
    if (this.debug) {
      console.log('[GatewayClient]', ...args);
    }
  }

  /**
   * Set API key for authentication
   * @param {string} apiKey - API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Set gateway URL
   * @param {string} url - Gateway URL
   */
  setGatewayUrl(url) {
    this.gatewayUrl = url;
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} debug - Debug mode
   */
  setDebug(debug) {
    this.debug = debug;
  }
}

// Legacy interface for backward compatibility
class RequestClient {
  constructor(gatewayUrl) {
    this.gateway = new GatewayClient({ gatewayUrl });
  }

  async invokeTemplate(templateName, options) {
    return await this.gateway.invokeTemplate(templateName, options);
  }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS
  module.exports = { GatewayClient, RequestClient };
} else if (typeof define === 'function' && define.amd) {
  // AMD
  define([], function() {
    return { GatewayClient, RequestClient };
  });
} else {
  // Browser globals
  window.GatewayClient = GatewayClient;
  window.RequestClient = RequestClient;
  
  // Mimic Freshworks client interface
  window.client = {
    request: {
      invokeTemplate: async (templateName, options) => {
        const client = new GatewayClient();
        return await client.invokeTemplate(templateName, options);
      }
    }
  };
} 
  
  // Auto-initialize for convenience
  if (typeof window !== 'undefined') {
    window.gatewayClient = new GatewayClient();
  }
})();

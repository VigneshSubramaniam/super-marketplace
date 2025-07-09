class DynamicCorsHandler {
  constructor(config) {
    this.config = config;
    this.registeredDomains = new Map(); // domain -> { apiKey, timestamp, metadata }
    this.apiKeys = config.apiKeys || {};
  }

  // Runtime domain registration
  registerDomain(domain, apiKey, metadata = {}) {
    if (this.validateApiKey(apiKey)) {
      this.registeredDomains.set(domain, {
        apiKey,
        timestamp: new Date().toISOString(),
        metadata
      });
      console.log(`✅ Domain registered: ${domain} (API Key: ${apiKey})`);
      return true;
    }
    console.log(`❌ Invalid API key for domain: ${domain}`);
    return false;
  }

  // Validate API key
  validateApiKey(apiKey) {
    return this.apiKeys.hasOwnProperty(apiKey);
  }

  // Get API key info
  getApiKeyInfo(apiKey) {
    return this.apiKeys[apiKey] || 'Unknown';
  }

  // Check if domain matches patterns
  matchesPattern(origin) {
    if (!origin) return false;
    
    const patterns = this.config.domainPatterns || [];
    return patterns.some(pattern => {
      // Convert wildcard pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '[^.]*');
      
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(origin);
    });
  }

  // Get CORS options
  getCorsOptions() {
    return {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) {
          return callback(null, true);
        }

        // Check configured allowed origins
        if (this.config.allowedOrigins.includes(origin)) {
          console.log(`✅ CORS allowed for configured origin: ${origin}`);
          return callback(null, true);
        }
        
        // Check runtime registered domains
        if (this.registeredDomains.has(origin)) {
          const domainInfo = this.registeredDomains.get(origin);
          console.log(`✅ CORS allowed for registered domain: ${origin} (${this.getApiKeyInfo(domainInfo.apiKey)})`);
          return callback(null, true);
        }
        
        // Check pattern-based domains
        if (this.matchesPattern(origin)) {
          console.log(`✅ CORS allowed for pattern-matched domain: ${origin}`);
          return callback(null, true);
        }
        
        console.log(`❌ CORS blocked for origin: ${origin}`);
        callback(new Error(`CORS policy violation: Origin ${origin} not allowed`));
      },
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Client-Domain']
    };
  }

  // Get registered domains info
  getRegisteredDomains() {
    const domains = {};
    this.registeredDomains.forEach((info, domain) => {
      domains[domain] = {
        appName: this.getApiKeyInfo(info.apiKey),
        registeredAt: info.timestamp,
        metadata: info.metadata
      };
    });
    return domains;
  }

  // Remove registered domain
  unregisterDomain(domain) {
    if (this.registeredDomains.has(domain)) {
      this.registeredDomains.delete(domain);
      console.log(`🗑️ Domain unregistered: ${domain}`);
      return true;
    }
    return false;
  }
}

module.exports = DynamicCorsHandler; 
class AuthMiddleware {
  constructor(corsHandler) {
    this.corsHandler = corsHandler;
  }

  // Main authentication middleware
  authenticate(req, res, next) {
    const origin = req.get('origin');
    const apiKey = req.headers['x-api-key'];
    const clientDomain = req.headers['x-client-domain'];

    // Skip auth for health check and gateway management endpoints
    if (req.path === '/health' || req.path.startsWith('/gateway/')) {
      return next();
    }

    // Check if origin is pre-configured (no API key required)
    if (this.corsHandler.config.allowedOrigins.includes(origin)) {
      console.log(`🔓 Pre-configured origin authenticated: ${origin}`);
      return next();
    }

    // Check if origin matches patterns (no API key required)
    if (this.corsHandler.matchesPattern(origin)) {
      console.log(`🔓 Pattern-matched origin authenticated: ${origin}`);
      return next();
    }

    // For other origins, require API key
    if (!apiKey) {
      console.log(`🔒 Authentication failed: No API key provided for origin ${origin}`);
      return res.status(401).json({
        success: false,
        error: 'Authentication Required',
        message: 'API key is required for this origin',
        origin: origin || 'unknown'
      });
    }

    // Validate API key
    if (!this.corsHandler.validateApiKey(apiKey)) {
      console.log(`🔒 Authentication failed: Invalid API key ${apiKey} for origin ${origin}`);
      return res.status(401).json({
        success: false,
        error: 'Invalid API Key',
        message: 'The provided API key is not valid',
        origin: origin || 'unknown'
      });
    }

    // Register domain if not already registered
    if (origin && !this.corsHandler.registeredDomains.has(origin)) {
      this.corsHandler.registerDomain(origin, apiKey, {
        userAgent: req.get('user-agent'),
        firstSeen: new Date().toISOString(),
        clientDomain: clientDomain
      });
    }

    console.log(`🔓 API key authenticated: ${apiKey} for origin ${origin}`);
    
    // Add auth info to request for downstream use
    req.auth = {
      apiKey,
      origin,
      clientDomain,
      appName: this.corsHandler.getApiKeyInfo(apiKey)
    };

    next();
  }

  // Rate limiting middleware (basic implementation)
  rateLimit(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    const requestCounts = new Map();

    return (req, res, next) => {
      const key = req.auth?.apiKey || req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      requestCounts.forEach((timestamps, k) => {
        const filtered = timestamps.filter(t => t > windowStart);
        if (filtered.length === 0) {
          requestCounts.delete(k);
        } else {
          requestCounts.set(k, filtered);
        }
      });

      // Get current request count
      const currentRequests = requestCounts.get(key) || [];
      
      if (currentRequests.length >= maxRequests) {
        console.log(`🚫 Rate limit exceeded for ${key}`);
        return res.status(429).json({
          success: false,
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Limit: ${maxRequests} per ${windowMs / 1000} seconds`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      // Add current request
      currentRequests.push(now);
      requestCounts.set(key, currentRequests);

      // Add rate limit headers
      res.set('X-RateLimit-Limit', maxRequests);
      res.set('X-RateLimit-Remaining', maxRequests - currentRequests.length);
      res.set('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

      next();
    };
  }

  // Middleware to log authenticated requests
  logAuthenticatedRequest(req, res, next) {
    if (req.auth) {
      console.log(`📊 Authenticated request: ${req.method} ${req.path} | App: ${req.auth.appName} | Origin: ${req.auth.origin}`);
    }
    next();
  }

  // Generate new API key (for admin use)
  static generateApiKey(prefix = 'sdk') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}-${timestamp}-${random}`;
  }

  // Validate API key format
  static isValidApiKeyFormat(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return false;
    
    // Check if it matches our generated format or is a development key
    const developmentKeyPattern = /^development-key-\d+$/;
    const generatedKeyPattern = /^[a-z]+-[a-z0-9]+-[a-z0-9]+$/;
    
    return developmentKeyPattern.test(apiKey) || generatedKeyPattern.test(apiKey);
  }
}

module.exports = AuthMiddleware; 
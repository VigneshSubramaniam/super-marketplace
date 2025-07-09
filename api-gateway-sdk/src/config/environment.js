class EnvironmentConfig {
  static getConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    const configs = {
      development: {
        gatewayPort: 9000,
        gatewayUrl: 'http://localhost:9000',
        allowedOrigins: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002'
        ],
        backendUrl: 'http://localhost:8000',
        domainPatterns: [
          'http://localhost:*'
        ],
        apiKeys: {
          'development-key-1': 'App 1 Development',
          'development-key-2': 'App 2 Development'
        }
      },
      staging: {
        gatewayPort: process.env.PORT || 9000,
        gatewayUrl: process.env.GATEWAY_URL || 'https://gateway-staging.company.com',
        allowedOrigins: [
          'https://app1-staging.company.com',
          'https://widget-staging.company.com'
        ],
        backendUrl: process.env.BACKEND_URL || 'https://api-staging.company.com',
        domainPatterns: [
          'https://*-staging.company.com'
        ],
        apiKeys: {
          [process.env.STAGING_API_KEY_1]: 'App 1 Staging',
          [process.env.STAGING_API_KEY_2]: 'Widget Staging'
        }
      },
      production: {
        gatewayPort: process.env.PORT || 443,
        gatewayUrl: process.env.GATEWAY_URL || 'https://gateway.company.com',
        allowedOrigins: [
          'https://app1.company.com',
          'https://widget.company.com'
        ],
        backendUrl: process.env.BACKEND_URL || 'https://api.company.com',
        domainPatterns: [
          'https://*.company.com',
          'https://*.trusted-partner.com'
        ],
        apiKeys: {
          [process.env.PROD_API_KEY_1]: 'App 1 Production',
          [process.env.PROD_API_KEY_2]: 'Widget Production'
        }
      }
    };
    
    return configs[env];
  }

  static isDevelopment() {
    return (process.env.NODE_ENV || 'development') === 'development';
  }

  static isProduction() {
    return process.env.NODE_ENV === 'production';
  }
}

module.exports = EnvironmentConfig; 
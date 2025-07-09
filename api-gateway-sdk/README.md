# API Gateway SDK

Universal API Gateway SDK for embedded applications that eliminates CORS issues and provides centralized API management.

## Overview

The API Gateway SDK acts as middleware between embedded applications and backend services, providing:

- **Dynamic CORS Management**: Runtime domain registration and pattern-based matching
- **Universal Client SDK**: Easy-to-use client library for embedded applications
- **Environment-Agnostic**: Works across development, staging, and production
- **Security & Monitoring**: API key authentication, rate limiting, and request logging
- **Proxy Architecture**: Eliminates CORS by acting as a same-origin proxy

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Embedded App  │───▶│  API Gateway    │───▶│   Backend API   │
│   (Any Domain)  │    │   SDK Server    │    │  (Port 8000)    │
│                 │    │   (Port 9000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd api-gateway-sdk
npm install
```

### 2. Start the Gateway Server

```bash
npm start
# or for development with auto-restart
npm run dev
```

### 3. Use the Client SDK in Your App

```javascript
// Initialize the SDK
const apiGateway = new ApiGatewaySDK({
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'your-api-key',
  clientDomain: window.location.origin
});

// Make API calls
const response = await apiGateway.get('/test');
const users = await apiGateway.getUsers();
await apiGateway.post('/data', { message: 'Hello' });
```

## Configuration

### Environment Configuration

The gateway supports multiple environments through `src/config/environment.js`:

```javascript
// Development
{
  gatewayPort: 9000,
  gatewayUrl: 'http://localhost:9000',
  allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  backendUrl: 'http://localhost:8000',
  domainPatterns: ['http://localhost:*']
}

// Production
{
  gatewayPort: 443,
  gatewayUrl: 'https://gateway.company.com',
  allowedOrigins: ['https://app1.company.com'],
  backendUrl: 'https://api.company.com',
  domainPatterns: ['https://*.company.com']
}
```

### API Keys

Configure API keys for different applications:

```javascript
apiKeys: {
  'development-key-1': 'App 1 Development',
  'development-key-2': 'App 2 Development',
  'prod-key-xyz': 'Production App'
}
```

## Core Components

### 1. Gateway Server (`src/gateway/server.js`)

Main server that handles:
- Request routing and proxying
- CORS management
- Authentication
- Rate limiting
- Logging and monitoring

### 2. Dynamic CORS Handler (`src/gateway/cors.js`)

Manages CORS policies with:
- Runtime domain registration
- Pattern-based domain matching
- API key validation
- Origin whitelisting

### 3. API Proxy Handler (`src/gateway/proxy.js`)

Handles request proxying with:
- Backend communication
- Header management
- Error handling
- Request/response logging
- Performance monitoring

### 4. Authentication Middleware (`src/gateway/auth.js`)

Provides:
- API key authentication
- Rate limiting
- Request logging
- Domain validation

### 5. Client SDK (`src/client/sdk.js`)

Universal client library with:
- Auto-configuration
- Retry logic
- Event system
- Convenience methods
- Error handling

## API Endpoints

### Gateway Management

- `GET /health` - Health check
- `GET /gateway/info` - Gateway information and stats
- `GET /gateway/stats` - Request statistics
- `GET /gateway/logs` - Recent request logs
- `GET /gateway/domains` - Domain configuration
- `POST /gateway/register-domain` - Register new domain
- `POST /gateway/generate-key` - Generate API key (dev only)

### API Proxy

- `ALL /api/*` - Proxy all API requests to backend

## Client SDK Usage

### Basic Usage

```javascript
const apiGateway = new ApiGatewaySDK({
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'your-api-key'
});

// HTTP Methods
await apiGateway.get('/endpoint');
await apiGateway.post('/endpoint', data);
await apiGateway.put('/endpoint', data);
await apiGateway.delete('/endpoint');

// Convenience Methods
await apiGateway.testConnection();
await apiGateway.submitData('test data');
await apiGateway.getUsers();
```

### Advanced Configuration

```javascript
const apiGateway = new ApiGatewaySDK({
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'your-api-key',
  clientDomain: window.location.origin,
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000
});

// Event Listeners
apiGateway.on('request', (data) => {
  console.log('Request sent:', data);
});

apiGateway.on('response', (data) => {
  console.log('Response received:', data);
});

apiGateway.on('error', (data) => {
  console.log('Request failed:', data);
});
```

### Runtime Configuration

```javascript
// Update configuration at runtime
apiGateway.setApiKey('new-api-key');
apiGateway.setGatewayUrl('https://new-gateway.com');
apiGateway.setTimeout(60000);
apiGateway.setRetryOptions(5, 2000);
```

## Security Features

### API Key Authentication

```javascript
// Required for non-whitelisted domains
headers: {
  'X-API-Key': 'your-api-key'
}
```

### Rate Limiting

- Default: 1000 requests per 15 minutes per API key
- Configurable per environment
- Returns rate limit headers

### CORS Protection

- Whitelist specific origins
- Pattern-based domain matching
- Runtime domain registration
- API key-based access control

## Monitoring & Analytics

### Request Statistics

```javascript
const stats = await apiGateway.getGatewayStats();
// Returns: response times, success rates, top origins, etc.
```

### Request Logging

```javascript
const logs = await fetch('/gateway/logs?limit=100');
// Returns: recent request logs with details
```

### Gateway Information

```javascript
const info = await apiGateway.getGatewayInfo();
// Returns: configuration, registered domains, stats
```

## Development

### Running in Development

```bash
# Start with auto-restart
npm run dev

# Generate API key
curl -X POST http://localhost:9000/gateway/generate-key \
  -H "Content-Type: application/json" \
  -d '{"prefix": "dev", "description": "Development key"}'
```

### Testing

```bash
# Health check
curl http://localhost:9000/health

# Test API proxy
curl -H "X-API-Key: development-key-1" \
  http://localhost:9000/api/test

# Register domain
curl -X POST http://localhost:9000/gateway/register-domain \
  -H "Content-Type: application/json" \
  -d '{"domain": "https://myapp.com", "apiKey": "your-key"}'
```

## Deployment

### Environment Variables

```bash
# Production
NODE_ENV=production
PORT=443
GATEWAY_URL=https://gateway.company.com
BACKEND_URL=https://api.company.com
PROD_API_KEY_1=your-production-key
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY src ./src
EXPOSE 9000
CMD ["npm", "start"]
```

## Integration Examples

### React Application

```javascript
// App.js
import React, { useState } from 'react';

const apiGateway = new ApiGatewaySDK({
  gatewayUrl: process.env.REACT_APP_GATEWAY_URL,
  apiKey: process.env.REACT_APP_API_KEY
});

function App() {
  const [data, setData] = useState(null);
  
  const handleApiCall = async () => {
    try {
      const response = await apiGateway.get('/users');
      setData(response.users);
    } catch (error) {
      console.error('API call failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleApiCall}>Load Users</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

### Vue.js Application

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';

const apiGateway = new ApiGatewaySDK({
  gatewayUrl: process.env.VUE_APP_GATEWAY_URL,
  apiKey: process.env.VUE_APP_API_KEY
});

const app = createApp(App);
app.config.globalProperties.$api = apiGateway;
app.mount('#app');
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure domain is registered or matches patterns
2. **API Key Issues**: Verify API key is valid and properly configured
3. **Connection Errors**: Check gateway server is running and accessible
4. **Rate Limiting**: Reduce request frequency or increase limits

### Debug Mode

```javascript
const apiGateway = new ApiGatewaySDK({
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'your-key'
});

// Enable debug logging
apiGateway.on('request', console.log);
apiGateway.on('response', console.log);
apiGateway.on('error', console.error);
```

## License

MIT License - see LICENSE file for details. 
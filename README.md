# Super Marketplace POC

A proof of concept for Super Marketplace featuring multiple React frontend applications with an API Gateway SDK for seamless cross-domain API communication.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   App 1 (3000)  │    │   App 2 (3001)  │    │   Backend API   │
│  Main App with  │───▶│  Embedded App   │    │   Server (8000) │
│     iframe      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       ▲
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐              │
         │              │  API Gateway    │              │
         └──────────────│   SDK (9000)    │──────────────┘
          Direct API    │                 │    Proxied API
          Calls         └─────────────────┘    Calls
```

## Components

### 1. Frontend Applications

- **App 1** (Port 3000): Main application with iframe embedding App 2
  - Makes **direct API calls** to backend server (port 8000)
  - No CORS issues since it's whitelisted in backend CORS configuration
  - Displays App 2 in an iframe

- **App 2** (Port 3001): Embedded application running in iframe
  - Uses **API Gateway SDK** to communicate with backend
  - Avoids CORS issues by proxying requests through the gateway
  - Cannot make direct API calls due to CORS restrictions

Both apps feature:
- React with webpack dev server
- Source maps for debugging
- Hot module replacement
- Modern UI with click counters

### 2. API Gateway SDK (Port 9000)

Universal API Gateway that eliminates CORS issues for embedded applications:
- **Dynamic CORS Management**: Runtime domain registration
- **Universal Client SDK**: Easy-to-use client library
- **Environment-Agnostic**: Development, staging, and production support
- **Security & Monitoring**: API key authentication and rate limiting
- **Proxy Architecture**: Same-origin proxy eliminates CORS for embedded apps

### 3. Backend Server (Port 8000)

Express.js server with:
- CORS configuration allowing:
  - App 1 (port 3000) for direct access
  - API Gateway (port 9000) for proxied access from App 2
- Sample API endpoints (`/api/test`, `/api/data`, `/api/users`)
- Comprehensive error handling
- Request logging and monitoring

## Quick Start

### 1. Install All Dependencies

```bash
npm run install:all
```

### 2. Start All Services

```bash
# Start all services (frontend apps, API Gateway, and backend)
npm start

# Or start individual services
npm run start:app1      # App 1 on port 3000
npm run start:app2      # App 2 on port 3001
npm run start:gateway   # API Gateway on port 9000
npm run start:server    # Backend server on port 8000
```

### 3. Access the Applications

- **App 1**: http://localhost:3000 (includes App 2 in iframe)
- **App 2**: http://localhost:3001 (standalone)
- **API Gateway**: http://localhost:9000 (management endpoints)
- **Backend API**: http://localhost:8000 (direct API access)

## API Communication Patterns

### App 1 - Direct API Calls

```javascript
// App 1 makes direct fetch calls to backend
const response = await fetch('http://localhost:8000/api/test', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### App 2 - API Gateway SDK

```javascript
// App 2 uses API Gateway SDK
const apiGateway = new ApiGatewaySDK({
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'development-key-2',
  clientDomain: window.location.origin
});

const response = await apiGateway.get('/test');
```

### Key Differences

1. **App 1**: Direct API calls, no CORS issues (whitelisted)
2. **App 2**: API Gateway SDK, CORS issues solved via proxy
3. **Backend**: Allows both direct (App 1) and proxied (Gateway) access

## CORS Solution

The architecture solves CORS issues differently for each app:

### App 1 (Direct Access)
```
App 1 (port 3000) → Backend (port 8000) ✅ Whitelisted in CORS
```

### App 2 (Proxied Access)
```
App 2 (port 3001) → API Gateway (port 9000) → Backend (port 8000) ✅ Proxy eliminates CORS
```

### Why This Architecture?

1. **App 1** is the main application and can be trusted with direct API access
2. **App 2** is embedded and uses the gateway for security and CORS management
3. **Backend** maintains control over which origins can access APIs directly
4. **API Gateway** provides a secure, monitored way for embedded apps to access APIs

## API Gateway SDK Usage

### In Your Application

```javascript
// Initialize the SDK
const apiGateway = new ApiGatewaySDK({
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'development-key-1',
  clientDomain: window.location.origin
});

// Make API calls
const response = await apiGateway.get('/test');
const users = await apiGateway.getUsers();
await apiGateway.post('/data', { message: 'Hello' });
```

### Key Features

1. **No CORS Issues**: All requests go through the gateway
2. **Dynamic Domain Registration**: Automatically registers your domain
3. **Retry Logic**: Built-in retry mechanism for failed requests
4. **Event System**: Listen to request/response events
5. **Environment Detection**: Auto-detects development vs production

## Development Scripts

```bash
# Install dependencies for all projects
npm run install:all

# Start all services in development mode
npm run dev

# Build all projects
npm run build

# Clean all node_modules
npm run clean

# Individual service commands
npm run dev:app1        # App 1 with hot reload
npm run dev:app2        # App 2 with hot reload
npm run dev:gateway     # API Gateway with nodemon
npm run dev:server      # Backend server with nodemon
```

## Project Structure

```
super-marketplace/
├── app1/                   # Main React application
│   ├── src/
│   │   ├── App.js         # Main app component with API Gateway SDK
│   │   └── App.css        # Styling
│   ├── public/
│   ├── webpack.config.js  # Webpack configuration
│   └── package.json
├── app2/                   # Embedded React application
│   ├── src/
│   │   ├── App.js         # Embedded app with API Gateway SDK
│   │   └── App.css        # Styling
│   ├── public/
│   ├── webpack.config.js  # Webpack configuration
│   └── package.json
├── api-gateway-sdk/        # API Gateway SDK
│   ├── src/
│   │   ├── gateway/       # Gateway server components
│   │   │   ├── server.js  # Main server
│   │   │   ├── cors.js    # Dynamic CORS handler
│   │   │   ├── proxy.js   # API proxy handler
│   │   │   └── auth.js    # Authentication middleware
│   │   ├── client/        # Client SDK
│   │   │   └── sdk.js     # Universal client library
│   │   └── config/        # Configuration
│   │       └── environment.js
│   ├── README.md          # Detailed SDK documentation
│   └── package.json
├── server/                 # Backend Express server
│   ├── server.js          # Main server file
│   └── package.json
├── .gitignore             # Git ignore rules
├── package.json           # Root package.json with scripts
└── README.md              # This file
```

## API Endpoints

### Gateway Management (Port 9000)

- `GET /health` - Health check
- `GET /gateway/info` - Gateway information and stats
- `GET /gateway/stats` - Request statistics
- `GET /gateway/logs` - Recent request logs
- `GET /gateway/domains` - Domain configuration
- `POST /gateway/register-domain` - Register new domain
- `POST /gateway/generate-key` - Generate API key (dev only)

### API Proxy (Port 9000)

- `ALL /api/*` - Proxy all API requests to backend

### Backend API (Port 8000)

- `GET /api/test` - Test endpoint
- `POST /api/data` - Data submission endpoint
- `GET /api/users` - Users list endpoint
- `GET /health` - Health check

## Configuration

### Environment Variables

```bash
# API Gateway SDK
NODE_ENV=development
PORT=9000
GATEWAY_URL=http://localhost:9000
BACKEND_URL=http://localhost:8000
```

### API Keys

Development keys are pre-configured:
- `development-key-1`: App 1 Development
- `development-key-2`: App 2 Development

Generate new keys:
```bash
curl -X POST http://localhost:9000/gateway/generate-key \
  -H "Content-Type: application/json" \
  -d '{"prefix": "dev", "description": "New development key"}'
```

## Testing

### Test API Gateway

```bash
# Health check
curl http://localhost:9000/health

# Test with API key
curl -H "X-API-Key: development-key-1" \
  http://localhost:9000/api/test

# Register domain
curl -X POST http://localhost:9000/gateway/register-domain \
  -H "Content-Type: application/json" \
  -d '{"domain": "https://myapp.com", "apiKey": "development-key-1"}'
```

### Test Frontend Integration

1. Open App 1: http://localhost:3000
2. Click "Test API Gateway Connection" - should succeed
3. Open App 2: http://localhost:3001
4. Click "Test API Gateway Connection" - should succeed
5. Both apps now work without CORS issues!

## Deployment

### Production Configuration

```javascript
// api-gateway-sdk/src/config/environment.js
production: {
  gatewayPort: 443,
  gatewayUrl: 'https://gateway.company.com',
  allowedOrigins: ['https://app1.company.com'],
  backendUrl: 'https://api.company.com',
  domainPatterns: ['https://*.company.com'],
  apiKeys: {
    [process.env.PROD_API_KEY_1]: 'Production App 1',
    [process.env.PROD_API_KEY_2]: 'Production App 2'
  }
}
```

### Docker Deployment

```dockerfile
# API Gateway SDK
FROM node:18-alpine
WORKDIR /app
COPY api-gateway-sdk/package*.json ./
RUN npm install --production
COPY api-gateway-sdk/src ./src
EXPOSE 9000
CMD ["npm", "start"]
```

## Monitoring

### Request Statistics

The API Gateway provides comprehensive monitoring:
- Request counts and response times
- Success rates and error tracking
- Top origins and API key usage
- Rate limiting metrics

Access monitoring at:
- http://localhost:9000/gateway/stats
- http://localhost:9000/gateway/logs

## Security Features

- **API Key Authentication**: Required for non-whitelisted domains
- **Rate Limiting**: 1000 requests per 15 minutes per API key
- **CORS Protection**: Configurable origin whitelisting
- **Request Logging**: Comprehensive audit trail
- **Environment Isolation**: Separate configs for dev/staging/prod

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 8000, 9000 are available
2. **CORS errors**: Verify API Gateway is running and configured
3. **API key issues**: Check API key is valid and properly set
4. **Connection errors**: Ensure all services are started

### Debug Mode

Enable debug logging in the client SDK:

```javascript
apiGateway.on('request', console.log);
apiGateway.on('response', console.log);
apiGateway.on('error', console.error);
```

## License

MIT License - see individual component licenses for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Future Enhancements

- WebSocket support through the gateway
- GraphQL proxy capabilities
- Advanced caching mechanisms
- Distributed tracing
- Admin dashboard for monitoring
- Automated API key management
- Circuit breaker patterns

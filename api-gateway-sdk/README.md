# Super Marketplace API Gateway SDK

A Freshworks-style request method system that solves CORS issues by providing a proxy service for API calls from embedded applications.

## 🚀 Overview

This system implements a similar architecture to Freshworks' Request Method feature, allowing embedded applications to make API calls to third-party services without running into CORS restrictions.

### How it works:

1. **Request Templates** are defined in `config/requests.json`
2. **Templates are declared** in `manifest.json` for each app
3. **Apps use `invokeTemplate()`** to make API calls through the gateway proxy
4. **Gateway processes templates** and makes the actual HTTP requests
5. **CORS is bypassed** since requests go through the server-side proxy

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend App  │───▶│  Gateway Proxy  │───▶│  External API   │
│   (Port 3001)   │    │   (Port 9000)   │    │ (Any Domain)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     CORS Safe              Server-Side            No CORS Issues
```

## 📁 Project Structure

```
api-gateway-sdk/
├── config/
│   └── requests.json         # Request templates configuration
├── src/
│   ├── config/
│   │   └── environment.js    # Environment configuration
│   ├── core/
│   │   └── RequestTemplateManager.js  # Template processing
│   ├── gateway/
│   │   └── server.js         # Main gateway server
│   └── client/
│       └── gateway-client.js # Client library
├── public/
│   └── gateway-client.js     # Built client library
├── manifest.json             # App configuration
├── package.json
└── README.md
```

## 🔧 Installation

1. **Install dependencies:**
```bash
cd api-gateway-sdk
npm install
```

2. **Start the gateway server:**
```bash
npm start
```

The gateway will be available at `http://localhost:9000`

## 📋 Configuration

### 1. Request Templates (`config/requests.json`)

Define HTTP request templates with dynamic variables:

```json
{
  "testExternalApi": {
    "method": "GET",
    "host": "jsonplaceholder.typicode.com",
    "protocol": "https",
    "path": "/posts/<%= context.postId %>",
    "headers": {
      "Content-Type": "application/json",
      "User-Agent": "Super-Marketplace-App"
    }
  },
  "createTicket": {
    "method": "POST",
    "host": "localhost:8000",
    "protocol": "http",
    "path": "/api/tickets",
    "headers": {
      "Authorization": "Bearer <%= context.apiKey %>",
      "Content-Type": "application/json"
    }
  }
}
```

### 2. Manifest Configuration (`manifest.json`)

Declare which templates each app can use:

```json
{
  "platform-version": "2.3",
  "product": {
    "app2": {
      "location": {
        "embedded_app": {
          "url": "http://localhost:3001"
        }
      },
      "requests": {
        "testExternalApi": {},
        "createTicket": {}
      }
    }
  }
}
```

## 🔌 Client Usage

### 1. Include the Client Library

```html
<script src="http://localhost:9000/gateway-client.js"></script>
```

### 2. Use the Freshworks-style Interface

```javascript
// Call external API through template
const response = await client.request.invokeTemplate('testExternalApi', {
  context: { 
    postId: 1 
  }
});

// POST data through template
const postResponse = await client.request.invokeTemplate('createTicket', {
  context: { 
    apiKey: 'your-api-key' 
  },
  body: {
    title: 'New Ticket',
    description: 'Ticket description'
  }
});
```

### 3. Advanced Usage

```javascript
// Create a custom client instance
const gatewayClient = new GatewayClient({
  gatewayUrl: 'http://localhost:9000',
  debug: true,
  retries: 3
});

// Use the client directly
const response = await gatewayClient.invokeTemplate('templateName', {
  context: { key: 'value' },
  body: { data: 'payload' }
});
```

## 🛠️ Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/gateway/info` | Gateway configuration |
| GET | `/gateway/stats` | Usage statistics |
| GET | `/gateway/templates` | Available templates |
| POST | `/gateway/invoke-template` | Invoke request template |
| GET | `/gateway-client.js` | Client library |

## 🎯 Benefits

✅ **CORS-Free**: No more CORS issues with third-party APIs  
✅ **Secure**: Controlled access through template declarations  
✅ **Flexible**: Dynamic variables in templates  
✅ **Centralized**: All API configurations in one place  
✅ **Logged**: Full request/response logging  
✅ **Retries**: Built-in retry mechanism  
✅ **Familiar**: Uses Freshworks' proven pattern  

## 🔧 Development

```bash
# Start in development mode
npm run dev

# Build client library
node build-client.js

# Test the gateway
curl http://localhost:9000/health
```

## 📊 Monitoring

View gateway statistics and logs:
- Stats: `http://localhost:9000/gateway/stats`
- Logs: `http://localhost:9000/gateway/logs`
- Templates: `http://localhost:9000/gateway/templates`

## 🚨 Error Handling

The system provides comprehensive error handling:

```javascript
try {
  const response = await client.request.invokeTemplate('templateName', options);
  console.log('Success:', response.data);
} catch (error) {
  console.error('Error:', error.message);
  // Handle different error types
}
```

## 🔄 Migration from Direct API Calls

**Before (CORS issues):**
```javascript
// This fails due to CORS
const response = await fetch('https://api.example.com/data');
```

**After (Works perfectly):**
```javascript
// This works through the gateway
const response = await client.request.invokeTemplate('exampleApi', {
  context: { param: 'value' }
});
```

## 🎉 Ready to Use!

The system is now ready to handle all your API calls without CORS issues. Just like Freshworks, but for your own applications! 
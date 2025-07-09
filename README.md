# Super Marketplace - Frontend Apps with Express Backend

This project contains two separate React frontend applications with webpack configurations, proper source maps for debugging, and an Express backend server with CORS restrictions.

## Project Structure

```
super-marketplace/
├── app1/                 # Main app running on port 3000
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── webpack.config.js
├── app2/                 # Embedded app running on port 3001
│   ├── src/
│   │   ├── index.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── webpack.config.js
├── server/               # Express backend on port 8000
│   ├── server.js
│   └── package.json
└── package.json
```

## Features

### Frontend Apps:
- **App 1 (Port 3000)**: Main application with buttons and iframe that embeds App 2
- **App 2 (Port 3001)**: Embedded application with buttons and click counter
- **Webpack Configuration**: Both apps have proper webpack configs with source maps
- **Development Mode**: Source maps enabled for debugging (`eval-source-map`)
- **Hot Module Replacement**: Live reload during development
- **API Integration**: Both apps have buttons to test API calls

### Backend Server:
- **Express Server (Port 8000)**: RESTful API server
- **CORS Protection**: Only allows requests from App 1 (port 3000)
- **Security**: Helmet middleware for security headers
- **Logging**: Morgan middleware for request logging
- **API Endpoints**: Multiple test endpoints for demonstration

## Installation

1. Install dependencies for all applications:
```bash
npm run install:all
```

Or install individually:
```bash
npm run install:app1
npm run install:app2
npm run install:server
```

## Development

### Start all applications:

**Terminal 1 - Start the server:**
```bash
npm run start:server
```

**Terminal 2 - Start App 2:**
```bash
npm run start:app2
```

**Terminal 3 - Start App 1:**
```bash
npm run start:app1
```

**Note**: Start in this order to ensure proper initialization.

### Individual app commands:
```bash
# Start Express server (port 8000)
npm run start:server

# Start App 1 (port 3000)
npm run start:app1

# Start App 2 (port 3001)
npm run start:app2
```

## API Testing

### Available Endpoints:
- `GET /health` - Health check
- `GET /api/test` - Test endpoint
- `POST /api/data` - Data submission
- `GET /api/users` - Get users list

### CORS Behavior:
- ✅ **App 1 (port 3000)**: API calls will succeed
- ❌ **App 2 (port 3001)**: API calls will be blocked by CORS

### Testing the API:
1. Open App 1 at `http://localhost:3000`
2. Click "Call API (Should Work)" - Should show success message
3. In the embedded App 2 iframe, click "Call API (Should Fail)" - Should show CORS error
4. Check browser console for detailed error messages

## Build

```bash
# Build both frontend apps
npm run build:all

# Build individual apps
npm run build:app1
npm run build:app2
```

## Usage

1. Start all applications using the commands above
2. Open your browser and navigate to `http://localhost:3000`
3. Test the regular buttons in both apps
4. Test the API call buttons to see CORS behavior:
   - App 1's API button should work (green button)
   - App 2's API button should fail with CORS error (red button)
5. Open browser DevTools to see:
   - Source maps working for debugging
   - Network requests and CORS errors
   - Console logs from both apps

## Architecture

### CORS Configuration:
The server uses a strict CORS policy that only allows requests from `http://localhost:3000` (App 1). This demonstrates:
- **Allowed Origin**: App 1 can successfully make API calls
- **Blocked Origin**: App 2 requests are rejected with CORS error
- **Security**: Prevents unauthorized cross-origin requests

### Security Features:
- Helmet middleware for security headers
- CORS protection with whitelist
- Request logging with Morgan
- Error handling for CORS violations

## Webpack Configuration

Both apps include:
- Babel transpilation for React and modern JavaScript
- CSS loader for styling
- HTML plugin for template generation
- Source maps for debugging (`eval-source-map`)
- Hot Module Replacement for development
- Production build optimization

## Next Steps

- ✅ Frontend apps are ready and functional
- ✅ Backend server with CORS protection is implemented
- ✅ API integration demonstrates security policies
- Ready for further API development and feature expansion

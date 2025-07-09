# Super Marketplace - Frontend Apps

This project contains two separate React frontend applications with webpack configurations and proper source maps for debugging.

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
└── package.json
```

## Features

- **App 1 (Port 3000)**: Main application with a button and iframe that embeds App 2
- **App 2 (Port 3001)**: Embedded application with a button and click counter
- **Webpack Configuration**: Both apps have proper webpack configs with source maps
- **Development Mode**: Source maps enabled for debugging (`eval-source-map`)
- **Hot Module Replacement**: Live reload during development

## Installation

1. Install dependencies for both apps:
```bash
npm run install:all
```

Or install individually:
```bash
npm run install:app1
npm run install:app2
```

## Development

### Start both apps:

**Terminal 1 - Start App 2 first:**
```bash
npm run start:app2
```

**Terminal 2 - Start App 1:**
```bash
npm run start:app1
```

**Note**: Start App 2 first since App 1 embeds App 2 in an iframe.

### Individual app commands:
```bash
# Start App 1 (port 3000)
npm run start:app1

# Start App 2 (port 3001)
npm run start:app2
```

## Build

```bash
# Build both apps
npm run build:all

# Build individual apps
npm run build:app1
npm run build:app2
```

## Usage

1. Start both applications using the commands above
2. Open your browser and navigate to `http://localhost:3000`
3. You'll see App 1 with its button and App 2 embedded in an iframe
4. Both apps have interactive buttons with click handlers
5. Open browser DevTools to see source maps working for debugging

## Webpack Configuration

Both apps include:
- Babel transpilation for React and modern JavaScript
- CSS loader for styling
- HTML plugin for template generation
- Source maps for debugging (`eval-source-map`)
- Hot Module Replacement for development
- Production build optimization

## Next Steps

- Ready for API integration (APIs will run on port 8000)
- Apps can be extended with additional features
- Source maps are configured for easy debugging

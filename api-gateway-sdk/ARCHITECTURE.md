# API Gateway SDK Architecture

## Overview

This architecture follows the principle of **centralized configuration with distributed permissions**. The API Gateway SDK maintains a master configuration of all available API templates, while individual apps declare which templates they're permitted to use.

## Components

### 1. API Gateway SDK (`api-gateway-sdk/`)

**Purpose**: Central service that manages all API templates and enforces permissions

**Key Files**:
- `config/requests.json` - Master configuration of all available API templates
- `src/gateway/server.js` - Main gateway server
- `src/core/RequestTemplateManager.js` - Template processing and validation
- `public/gateway-client.js` - Client library for apps to use

**Responsibilities**:
- Maintains master list of all available API templates
- Validates app permissions against manifest declarations
- Processes template variables with context
- Makes actual API calls on behalf of apps
- Handles CORS and security

### 2. Individual Apps (e.g., `app2/`)

**Purpose**: External applications that consume APIs through the gateway

**Key Files**:
- `manifest.json` - Declares which templates this app is permitted to use
- Application code that calls `client.request.invokeTemplate()`

**Responsibilities**:
- Declare required API permissions in manifest
- Provide context data for template processing
- Handle responses from gateway

## Request Flow

1. **App** calls `client.request.invokeTemplate('templateName', { context: {...} })`
2. **Gateway** receives request and validates:
   - Template exists in master config
   - App has permission (declared in manifest)
   - Required context variables are provided
3. **Gateway** processes template with context variables
4. **Gateway** makes actual API call to target service
5. **Gateway** returns response to app

## Security Model

- **Template Validation**: Only templates in master config can be used
- **Permission Enforcement**: Apps can only use templates declared in their manifest
- **Context Isolation**: Each app provides its own context data
- **CORS Bypass**: Gateway handles all external API calls

## Example Configuration

### Gateway Master Config (`api-gateway-sdk/config/requests.json`)
```json
{
  "backendTestApi": {
    "method": "GET",
    "host": "localhost:8000",
    "protocol": "http",
    "path": "/api/test"
  },
  "getUserProfile": {
    "method": "GET",
    "host": "localhost:8000",
    "protocol": "http",
    "path": "/api/user/<%= context.userId %>",
    "headers": {
      "Authorization": "Bearer <%= context.token %>"
    }
  }
}
```

### App Permissions (`app2/manifest.json`)
```json
{
  "product": {
    "app2": {
      "requests": {
        "backendTestApi": {
          "description": "Test API endpoint"
        }
      }
    }
  }
}
```

## Benefits

1. **Centralized Management**: All API templates managed in one place
2. **Security**: Apps can only access permitted templates
3. **Scalability**: Easy to add new templates without updating all apps
4. **Isolation**: Apps don't need to know implementation details
5. **CORS Solution**: Gateway handles all cross-origin requests

## Production Considerations

- Gateway and apps would be in separate repositories
- Apps would be deployed independently
- Gateway would be a shared service across all apps
- Manifest permissions would be validated during app registration 
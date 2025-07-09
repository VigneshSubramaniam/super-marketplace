const fs = require('fs');
const path = require('path');

// Read the client library
const clientPath = path.join(__dirname, 'src/client/gateway-client.js');
const clientCode = fs.readFileSync(clientPath, 'utf8');

// Create a browser-compatible version
const browserCode = `
/* Super Marketplace Gateway Client Library */
(function() {
  'use strict';
  
  ${clientCode}
  
  // Auto-initialize for convenience
  if (typeof window !== 'undefined') {
    window.gatewayClient = new GatewayClient();
  }
})();
`;

// Write to public directory
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'gateway-client.js');
fs.writeFileSync(outputPath, browserCode);

console.log('✅ Browser client library built successfully!');
console.log(`📁 Output: ${outputPath}`);
console.log('📋 Include in HTML: <script src="http://localhost:9000/gateway-client.js"></script>'); 
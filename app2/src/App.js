import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [apiResponse, setApiResponse] = useState('');
  const [gatewayApiResponse, setGatewayApiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [gatewayApiLoading, setGatewayApiLoading] = useState(false);

  useEffect(() => {
    // Load the gateway client library
    const script = document.createElement('script');
    script.src = 'http://localhost:9000/gateway-client.js';
    script.crossOrigin = 'anonymous'; // Explicitly set crossOrigin
    script.onload = () => {
      console.log('✅ Gateway client library loaded successfully');
      console.log('Available objects:', {
        GatewayClient: typeof window.GatewayClient,
        RequestClient: typeof window.RequestClient,
        client: typeof window.client,
        gatewayClient: typeof window.gatewayClient
      });
      // Set debug mode for development
      if (window.gatewayClient) {
        window.gatewayClient.setDebug(true);
      }
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load gateway client library:', error);
      console.error('Script src:', script.src);
      console.error('Error details:', {
        type: error.type,
        target: error.target,
        message: error.message
      });
    };
    
    document.head.appendChild(script);

    return () => {
      // Clean up: remove script if component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleButtonClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setMessage(`Button clicked ${newCount} times in App 2!`);
    console.log(`App 2 button clicked ${newCount} times`);
  };

  const handleApiCall = async () => {
    setLoading(true);
    setApiResponse('');
    
    try {
      const response = await fetch('http://localhost:8000/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setApiResponse(`✅ SUCCESS: ${data.message} (Origin: ${data.origin})`);
        console.log('API call successful from App 2:', data);
      } else {
        const errorData = await response.json();
        setApiResponse(`❌ ERROR: ${errorData.message || 'API call failed'}`);
        console.error('API call failed:', errorData);
      }
    } catch (error) {
      setApiResponse(`❌ CORS BLOCKED: ${error.message}`);
      console.error('CORS error from App 2:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGatewayApiCall = async () => {
    setGatewayApiLoading(true);
    setGatewayApiResponse('');
    
    try {
      if (!window.client) {
        throw new Error('Gateway client not loaded');
      }

      // Call the same backend API through the gateway
      const response = await window.client.request.invokeTemplate('backendTestApi', {
        context: {}
      });

      if (response.success) {
        setGatewayApiResponse(`✅ GATEWAY SUCCESS: ${response.data.message} (Origin: ${response.data.origin})`);
        console.log('Gateway API call successful:', response.data);
      } else {
        setGatewayApiResponse(`❌ GATEWAY ERROR: ${response.error}`);
        console.error('Gateway API call failed:', response);
      }
    } catch (error) {
      setGatewayApiResponse(`❌ GATEWAY ERROR: ${error.message}`);
      console.error('Gateway API error:', error);
    } finally {
      setGatewayApiLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>App 2 - Embedded Application</h1>
        <div className="button-group">
          <button onClick={handleButtonClick} className="app-button">
            Click Me (App 2)
          </button>
          <button 
            onClick={handleApiCall} 
            className="app-button api-button"
            disabled={loading}
          >
            {loading ? 'Calling API...' : 'Call API (Should Fail)'}
          </button>
          <button 
            onClick={handleGatewayApiCall} 
            className="app-button gateway-button"
            disabled={gatewayApiLoading}
          >
            {gatewayApiLoading ? 'Calling Gateway...' : 'Call Same API via Gateway'}
          </button>
        </div>
        {message && <p className="message">{message}</p>}
        {apiResponse && (
          <p className={`api-response ${apiResponse.includes('SUCCESS') ? 'success' : 'error'}`}>
            {apiResponse}
          </p>
        )}
        {gatewayApiResponse && (
          <p className={`api-response ${gatewayApiResponse.includes('SUCCESS') ? 'success' : 'error'}`}>
            {gatewayApiResponse}
          </p>
        )}
        
      </header>
      
      <main className="app-main">
        <div className="info-box">
          <h3>This is App 2 running on port 3001</h3>
          <p>This app is embedded in App 1 via an iframe.</p>
          <p>🚫 <strong>Direct API calls</strong> are blocked by CORS (red button)</p>
          <p>✅ <strong>Gateway API calls</strong> work perfectly (purple button - same API!)</p>
          <p>Click the buttons above to test both approaches!</p>
        </div>
      </main>
    </div>
  );
}

export default App; 
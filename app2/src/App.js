import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [apiResponse, setApiResponse] = useState('');
  const [templateResponse, setTemplateResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [gatewayApiResponse, setGatewayApiResponse] = useState('');
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

  const handleTemplateCall = async () => {
    setTemplateLoading(true);
    setTemplateResponse('');
    
    try {
      if (!window.client) {
        throw new Error('Gateway client not loaded');
      }

      // Test external API call through template
      const response = await window.client.request.invokeTemplate('testExternalApi', {
        context: { 
          postId: 1 
        }
      });

      if (response.success) {
        setTemplateResponse(`✅ TEMPLATE SUCCESS: ${response.data.title} (ID: ${response.data.id})`);
        console.log('Template call successful:', response.data);
      } else {
        setTemplateResponse(`❌ TEMPLATE ERROR: ${response.error}`);
        console.error('Template call failed:', response);
      }
    } catch (error) {
      setTemplateResponse(`❌ TEMPLATE ERROR: ${error.message}`);
      console.error('Template error from App 2:', error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleWeatherCall = async () => {
    setTemplateLoading(true);
    setTemplateResponse('');
    
    try {
      if (!window.client) {
        throw new Error('Gateway client not loaded');
      }

      // Test weather API call through template
      const response = await window.client.request.invokeTemplate('weatherApi', {
        context: { 
          city: 'London',
          weatherApiKey: 'demo-key' // This would fail but shows the pattern
        }
      });

      if (response.success) {
        setTemplateResponse(`✅ WEATHER SUCCESS: ${response.data.weather[0].description}`);
        console.log('Weather call successful:', response.data);
      } else {
        setTemplateResponse(`❌ WEATHER ERROR: ${response.error}`);
        console.error('Weather call failed:', response);
      }
    } catch (error) {
      setTemplateResponse(`❌ WEATHER ERROR: ${error.message}`);
      console.error('Weather error from App 2:', error);
    } finally {
      setTemplateLoading(false);
    }
  };

  const handlePostDataCall = async () => {
    setTemplateLoading(true);
    setTemplateResponse('');
    
    try {
      if (!window.client) {
        throw new Error('Gateway client not loaded');
      }

      // Test POST data through template
      const response = await window.client.request.invokeTemplate('postExternalData', {
        context: {},
        body: {
          title: 'Test Post from App 2',
          body: 'This is a test post created via template',
          userId: 1
        }
      });

      if (response.success) {
        setTemplateResponse(`✅ POST SUCCESS: Created post with ID ${response.data.id}`);
        console.log('POST call successful:', response.data);
      } else {
        setTemplateResponse(`❌ POST ERROR: ${response.error}`);
        console.error('POST call failed:', response);
      }
    } catch (error) {
      setTemplateResponse(`❌ POST ERROR: ${error.message}`);
      console.error('POST error from App 2:', error);
    } finally {
      setTemplateLoading(false);
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
        
        <div className="template-section">
          <h3>🔥 NEW: Request Templates (Freshworks Style)</h3>
          <div className="button-group">
            <button 
              onClick={handleTemplateCall} 
              className="app-button template-button"
              disabled={templateLoading}
            >
              {templateLoading ? 'Loading...' : 'Test External API'}
            </button>
            <button 
              onClick={handlePostDataCall} 
              className="app-button template-button"
              disabled={templateLoading}
            >
              {templateLoading ? 'Loading...' : 'POST Data'}
            </button>
            <button 
              onClick={handleWeatherCall} 
              className="app-button template-button"
              disabled={templateLoading}
            >
              {templateLoading ? 'Loading...' : 'Weather API'}
            </button>
          </div>
          {templateResponse && (
            <p className={`api-response ${templateResponse.includes('SUCCESS') ? 'success' : 'error'}`}>
              {templateResponse}
            </p>
          )}
        </div>
      </header>
      
      <main className="app-main">
        <div className="info-box">
          <h3>This is App 2 running on port 3001</h3>
          <p>This app is embedded in App 1 via an iframe.</p>
          <p>🚫 <strong>Direct API calls</strong> are blocked by CORS (red button)</p>
          <p>✅ <strong>Gateway API calls</strong> work perfectly (purple button - same API!)</p>
          <p>✅ <strong>Template calls</strong> work through the gateway proxy (green buttons)</p>
          <p>Click the buttons above to test all approaches!</p>
        </div>
      </main>
    </div>
  );
}

export default App; 
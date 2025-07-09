import React, { useState, useEffect } from 'react';
import './App.css';

// API Gateway SDK configuration for App 2
const API_GATEWAY_CONFIG = {
  gatewayUrl: 'http://localhost:9000',
  apiKey: 'development-key-2',
  clientDomain: window.location.origin,
  timeout: 30000,
  retryAttempts: 3
};

// Initialize API Gateway SDK
class ApiGatewaySDK {
  constructor(config = {}) {
    this.gatewayUrl = config.gatewayUrl || 'http://localhost:9000';
    this.apiKey = config.apiKey || null;
    this.clientDomain = config.clientDomain || window.location.origin;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.gatewayUrl}/api${endpoint}`;
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Domain': this.clientDomain,
        ...options.headers
      },
      ...options
    };

    if (this.apiKey) {
      requestOptions.headers['X-API-Key'] = this.apiKey;
    }

    if (options.body && requestOptions.method !== 'GET') {
      requestOptions.body = typeof options.body === 'string' 
        ? options.body 
        : JSON.stringify(options.body);
    }

    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    return data;
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async testConnection() {
    return this.get('/test');
  }

  async submitData(data) {
    return this.post('/data', { message: data });
  }

  async getUsers() {
    return this.get('/users');
  }
}

const apiGateway = new ApiGatewaySDK(API_GATEWAY_CONFIG);

function App() {
  const [count, setCount] = useState(0);
  const [apiResponse, setApiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setCount(count + 1);
    console.log('App 2 button clicked!', count + 1);
  };

  const handleApiCall = async () => {
    setLoading(true);
    setApiResponse('Loading...');
    
    try {
      const response = await apiGateway.testConnection();
      setApiResponse(`✅ Success: ${response.message}`);
      console.log('API Gateway Response:', response);
    } catch (error) {
      setApiResponse(`❌ Error: ${error.message}`);
      console.error('API Gateway Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSubmission = async () => {
    setLoading(true);
    setApiResponse('Submitting data...');
    
    try {
      const response = await apiGateway.submitData(`Test data from App 2 - ${new Date().toISOString()}`);
      setApiResponse(`✅ Data submitted: ${response.message}`);
      console.log('Data Submission Response:', response);
    } catch (error) {
      setApiResponse(`❌ Error: ${error.message}`);
      console.error('Data Submission Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUsersCall = async () => {
    setLoading(true);
    setApiResponse('Fetching users...');
    
    try {
      const response = await apiGateway.getUsers();
      setApiResponse(`✅ Users fetched: ${response.users.length} users`);
      console.log('Users Response:', response);
    } catch (error) {
      setApiResponse(`❌ Error: ${error.message}`);
      console.error('Users Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>App 2 - Embedded Application</h1>
        <p>Running on port 3001</p>
        
        <div className="button-container">
          <button onClick={handleClick} className="app-button">
            Click me! (Clicked {count} times)
          </button>
          
          <button 
            onClick={handleApiCall} 
            className="api-button" 
            disabled={loading}
          >
            Test API Gateway Connection
          </button>
          
          <button 
            onClick={handleDataSubmission} 
            className="api-button" 
            disabled={loading}
          >
            Submit Data via Gateway
          </button>
          
          <button 
            onClick={handleUsersCall} 
            className="api-button" 
            disabled={loading}
          >
            Get Users via Gateway
          </button>
        </div>
        
        {apiResponse && (
          <div className="api-response">
            <strong>API Gateway Response:</strong>
            <pre>{apiResponse}</pre>
          </div>
        )}
        
        <div className="app-info">
          <p>🔗 This app uses API Gateway SDK with development-key-2</p>
          <p>📡 Gateway URL: http://localhost:9000</p>
          <p>🏠 Client Domain: {window.location.origin}</p>
        </div>
      </header>
    </div>
  );
}

export default App; 
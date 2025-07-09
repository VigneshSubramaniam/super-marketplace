import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleButtonClick = () => {
    setMessage('Button clicked in App 1!');
    console.log('App 1 button clicked');
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
        console.log('API call successful from App 1:', data);
      } else {
        const errorData = await response.json();
        setApiResponse(`❌ ERROR: ${errorData.message || 'API call failed'}`);
        console.error('API call failed:', errorData);
      }
    } catch (error) {
      setApiResponse(`❌ NETWORK ERROR: ${error.message}`);
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>App 1 - Main Application</h1>
        <div className="button-group">
          <button onClick={handleButtonClick} className="app-button">
            Click Me (App 1)
          </button>
          <button 
            onClick={handleApiCall} 
            className="app-button api-button"
            disabled={loading}
          >
            {loading ? 'Calling API...' : 'Call API (Should Work)'}
          </button>
        </div>
        {message && <p className="message">{message}</p>}
        {apiResponse && (
          <p className={`api-response ${apiResponse.includes('SUCCESS') ? 'success' : 'error'}`}>
            {apiResponse}
          </p>
        )}
      </header>
      
      <main className="app-main">
        <h2>App 2 Embedded Below:</h2>
        <div className="iframe-container">
          <iframe
            src="http://localhost:3001"
            title="App 2"
            className="app-iframe"
            width="100%"
            height="400px"
          />
        </div>
      </main>
    </div>
  );
}

export default App; 
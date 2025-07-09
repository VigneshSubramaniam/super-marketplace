import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [apiResponse, setApiResponse] = useState('');
  const [loading, setLoading] = useState(false);

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
        </div>
        {message && <p className="message">{message}</p>}
        {apiResponse && (
          <p className={`api-response ${apiResponse.includes('SUCCESS') ? 'success' : 'error'}`}>
            {apiResponse}
          </p>
        )}
      </header>
      
      <main className="app-main">
        <div className="info-box">
          <h3>This is App 2 running on port 3001</h3>
          <p>This app is embedded in App 1 via an iframe.</p>
          <p><strong>Note:</strong> API calls from this app will be blocked by CORS policy.</p>
        </div>
      </main>
    </div>
  );
}

export default App; 
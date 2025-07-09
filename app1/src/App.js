import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [apiResponse, setApiResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setCount(count + 1);
    console.log('App 1 button clicked!', count + 1);
  };

  const handleApiCall = async () => {
    setLoading(true);
    setApiResponse('Loading...');
    
    try {
      const response = await fetch('http://localhost:8000/api/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(`✅ Success: ${data.message}`);
      console.log('Direct API Response:', data);
    } catch (error) {
      setApiResponse(`❌ Error: ${error.message}`);
      console.error('Direct API Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataSubmission = async () => {
    setLoading(true);
    setApiResponse('Submitting data...');
    
    try {
      const response = await fetch('http://localhost:8000/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Test data from App 1 - ${new Date().toISOString()}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(`✅ Data submitted: ${data.message}`);
      console.log('Data Submission Response:', data);
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
      const response = await fetch('http://localhost:8000/api/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApiResponse(`✅ Users fetched: ${data.users.length} users`);
      console.log('Users Response:', data);
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
        <h1>App 1 - Main Application</h1>
        <p>Running on port 3000</p>
        <p>🔗 Makes direct API calls to backend server (port 8000)</p>
        
        <div className="button-container">
          <button onClick={handleClick} className="app-button">
            Click me! (Clicked {count} times)
          </button>
          
          <button 
            onClick={handleApiCall} 
            className="api-button" 
            disabled={loading}
          >
            Test Direct API Connection
          </button>
          
          <button 
            onClick={handleDataSubmission} 
            className="api-button" 
            disabled={loading}
          >
            Submit Data Directly
          </button>
          
          <button 
            onClick={handleUsersCall} 
            className="api-button" 
            disabled={loading}
          >
            Get Users Directly
          </button>
        </div>
        
        {apiResponse && (
          <div className="api-response">
            <strong>Direct API Response:</strong>
            <pre>{apiResponse}</pre>
          </div>
        )}
        
        <div className="iframe-container">
          <h2>Embedded App 2 (Uses API Gateway)</h2>
          <iframe 
            src="http://localhost:3001" 
            width="100%" 
            height="400"
            title="App 2"
          />
        </div>
      </header>
    </div>
  );
}

export default App; 
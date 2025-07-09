import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');

  const handleButtonClick = () => {
    setMessage('Button clicked in App 1!');
    console.log('App 1 button clicked');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>App 1 - Main Application</h1>
        <button onClick={handleButtonClick} className="app-button">
          Click Me (App 1)
        </button>
        {message && <p className="message">{message}</p>}
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
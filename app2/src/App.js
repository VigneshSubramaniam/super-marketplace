import React, { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const handleButtonClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setMessage(`Button clicked ${newCount} times in App 2!`);
    console.log(`App 2 button clicked ${newCount} times`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>App 2 - Embedded Application</h1>
        <button onClick={handleButtonClick} className="app-button">
          Click Me (App 2)
        </button>
        {message && <p className="message">{message}</p>}
      </header>
      
      <main className="app-main">
        <div className="info-box">
          <h3>This is App 2 running on port 3001</h3>
          <p>This app is embedded in App 1 via an iframe.</p>
        </div>
      </main>
    </div>
  );
}

export default App; 
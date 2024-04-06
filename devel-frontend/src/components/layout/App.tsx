import React, { useState } from 'react';
import './App.css';
import { AuthProvider } from '../../hooks/useAuth';
import Login from '../auth/Login'



function App() {
  const baseUrl = process.env.REACT_APP_API_BASE_URL;
  const [message, setMessage] = useState('');
  const fetchMessage = () => {
    fetch(baseUrl + "/message").then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error("There was an error!", error));
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>Message from backend: {message}</p>
        <button className="btn btn-primary" onClick={fetchMessage}>
          Click This
        </button>
        <AuthProvider>
          <div>
            <Login></Login>
          </div>
        </AuthProvider>
      </header>  
    </div>
  );
}

export default App;
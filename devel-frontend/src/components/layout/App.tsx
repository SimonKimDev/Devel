import React, { useEffect, useState } from 'react';
import './App.css';
import { AuthProvider } from '../../hooks/useAuth';
import { msalInstance } from '../../services/authentication/msalConfig';
import Login from '../auth/Login'



function App() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [message, setMessage] = useState('');
  const fetchMessage = () => {
    fetch(baseUrl + "/message").then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error("There was an error!", error));
  };

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        await msalInstance.initialize();
        await msalInstance.handleRedirectPromise()
          .then((tokenResponse) => {
            console.log(tokenResponse);
          })
          .catch((error) => {
            console.error("Error handling redirect:", error);
          });
      } catch (error) {
        console.error("Error initializing MSAL:", error);
      }
    };
    initializeMsal();
    // The empty dependency array ensures this runs once on mount
  }, []);
  
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
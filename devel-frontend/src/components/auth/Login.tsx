import React, { useState, useEffect }from 'react';
import { useAuth } from '../../hooks/useAuth';
import { msalInstance } from '../../services/authentication/msalConfig';

const Login: React.FC = () => {
    const { signIn, signOut, onAuthStateChanged } = useAuth();
    const [isLoggedIn, setIsLoggedIn] = useState(false);


    useEffect(() => {
      // Register the listener
      onAuthStateChanged((isAuthenticated) => {
        setIsLoggedIn(isAuthenticated);
      });
  
      // Optional: Check the current auth state on component mount
      setIsLoggedIn(msalInstance.getAllAccounts().length > 0);
    }, [onAuthStateChanged]);
  
    const handleAuthAction = () => {
      if (isLoggedIn) {
        signOut();
      } else {
        signIn("popup");
      }
    };
    
    return (
      <button className="btn btn-primary" onClick={handleAuthAction}>
            {isLoggedIn ? 'Logout' : 'Login'}
      </button>
    );
  };
  
export default Login
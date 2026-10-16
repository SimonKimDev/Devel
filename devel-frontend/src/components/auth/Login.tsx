import React, { useState, useEffect }from 'react';
import { useAuth } from '../../hooks/useAuth';
import { msalInstance } from '../../services/authentication/msalConfig';

const Login: React.FC = () => {
    const { signIn, signOut, onAuthStateChanged } = useAuth();
    const [isLoggedIn, setIsLoggedIn] = useState(() => msalInstance.getAllAccounts().length > 0);


    useEffect(() => {
      onAuthStateChanged((isAuthenticated) => {
        setIsLoggedIn(isAuthenticated);
      });
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
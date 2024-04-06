import React from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginProps {
    onClick: () => void;
}


const Login: React.FC = () => {
    const { signIn } = useAuth();
  
    const handleLogin = async () => {
      await signIn("popup");
    };
  
    return (
      <button className="btn btn-primary" onClick={handleLogin}>Login</button>
    );
  };
  
export default Login
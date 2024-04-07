import { useContext, createContext, ReactNode } from 'react';
import * as authService from '../services/authentication/authService';

const AuthContext = createContext({ 
  signIn: authService.signIn, 
  signOut: authService.signOut,
  onAuthStateChanged: authService.onAuthStateChanged,
 });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AuthContext.Provider value={{ 
      signIn: authService.signIn,
      signOut: authService.signOut,
      onAuthStateChanged: authService.onAuthStateChanged }}>
        {children}
    </AuthContext.Provider>
  );
};

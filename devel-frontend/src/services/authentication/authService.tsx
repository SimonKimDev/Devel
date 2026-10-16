import { msalInstance } from './msalConfig';
import { EndSessionRequest, PopupRequest, RedirectRequest } from '@azure/msal-browser';

// Initialize a listener variable
let authStateListener: ((isAuthenticated: boolean) => void) | null = null;

// Method to register a listener
export const onAuthStateChanged = (listener: (isAuthenticated: boolean) => void) => {
  authStateListener = listener;
};

const notifyAuthStateChanged = () => {
  const isAuthenticated = msalInstance.getAllAccounts().length > 0;
  if (authStateListener) {
    authStateListener(isAuthenticated);
  }
};

export const signIn = async (method: "popup" | "redirect" = "popup"): Promise<void> => {
  const request: PopupRequest | RedirectRequest = {
    scopes: ["User.Read"],
    prompt: "login"
  };

  try {
    if (method === "popup") {
      msalInstance.loginPopup(request);
    } else {
      msalInstance.loginRedirect(request);
    }

    notifyAuthStateChanged();
  }
  catch (error) {
    console.error(error);
  }
};

export const signOut = (): void => {
  const logoutRequest: EndSessionRequest= {
    postLogoutRedirectUri: window.location.origin
  }
  msalInstance.logoutRedirect(logoutRequest);
  notifyAuthStateChanged();
};
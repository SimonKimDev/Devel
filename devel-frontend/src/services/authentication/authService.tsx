import { msalInstance } from './msalConfig';
import { AuthenticationResult, PopupRequest, RedirectRequest } from '@azure/msal-browser';

export const signIn = (method: "popup" | "redirect" = "popup"): Promise<AuthenticationResult | null> => {
  const request: PopupRequest | RedirectRequest = {
    scopes: ["User.Read"]
  };

  if (method === "popup") {
    return msalInstance.loginPopup(request);
  } else {
    msalInstance.loginRedirect(request);
    return Promise.resolve(null); // Redirect does not return a response
  }
};

// Add more methods (signOut, acquireToken, etc.) as needed

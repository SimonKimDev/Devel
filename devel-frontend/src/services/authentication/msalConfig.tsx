// src/services/authentication/msalConfig.ts
import { Configuration, PublicClientApplication } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: "9ae25221-cee1-4ef0-94ab-9ff0c6eaace4",
    authority: "https://login.microsoftonline.com/5670d53a-44fd-4424-8a08-36fc84a10804",
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your tokens are stored
    storeAuthStateInCookie: true, // Set to true if you have issues on certain browsers
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

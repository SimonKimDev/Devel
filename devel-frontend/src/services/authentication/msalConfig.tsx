// src/services/authentication/msalConfig.ts
import { Configuration, PublicClientApplication } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: "YOUR_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: window.location.origin
  },
  // Additional configurations
};

export const msalInstance = new PublicClientApplication(msalConfig);

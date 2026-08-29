export interface AppEnvironment {
  production: boolean;
  version: string;
  defaultCompanyId: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  api: {
    baseUrl: string;
    ordersApi: string;
    directOrdersApi: string;
  };
  inventory: {
    reconciliationMode: 'legacy' | 'recon';
  };
  paypal: {
    clientId: string;
    sandbox: boolean;
    apiUrl: string;
  };
}

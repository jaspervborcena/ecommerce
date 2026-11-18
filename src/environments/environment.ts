// Development environment configuration for Tovrika.

export const environment = {
  production: false,
  version: '1.0.2',
  companyId: 'LnC9a2KOhNW8wtSverZx',
  companySlug: 'tovrika',
  firebase: {
    apiKey: "AIzaSyDNIYovvzNKVj40h99kxOHu5yfEUzx7OYA",
    authDomain: "jasperpos-1dfd5.firebaseapp.com",
    projectId: "jasperpos-1dfd5",
    storageBucket: "jasperpos-1dfd5.firebasestorage.app",
    messagingSenderId: "251258556341",
    appId: "1:251258556341:web:28cdcafbdb4ad89675d3fc",
    measurementId: "G-MG8T2RZ051"
  },
  api: {
    baseUrl: "",
    ordersApi: "",
    directOrdersApi: "",
  },
  inventory: {
    reconciliationMode: 'recon' as 'legacy' | 'recon'
  },
  paypal: {
    clientId: 'ASj0btqJ9ctHcaXO19btNq5AiAPcvMJ-V-xqq9atKiuiJ2uGQ0JoAHlCXWwM_m5_Zdmn9CQkYxQkiQGu',
    sandbox: true,
    apiUrl: '/paypal'
  }
};

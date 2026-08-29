// PRODUCTION ENVIRONMENT - Uses shaotang-74c95 Firebase project
export const environment = {
  production: true,
  version: '1.0.2',
  defaultCompanyId: 'kTAtjOEjwrrzdneego2o',
  firebase: {
    apiKey: "AIzaSyAD963HrmOflB5FxaBTMhvlXpN737lqCJc",
    authDomain: "shaotang-74c95.firebaseapp.com",
    projectId: "shaotang-74c95",
    storageBucket: "shaotang-74c95.firebasestorage.app",
    messagingSenderId: "92779471481",
    appId: "1:92779471481:web:b825c149f7dcec7db8aaa8",
    measurementId: "G-ZRE0P8WYFM"
  },
  api: {
    // Disabled in frontend; production builds should avoid calling Cloud Functions from the UI directly.
    baseUrl: "",
    ordersApi: "",
    // directOrdersApi intentionally disabled for Firestore-only Sales Summary
    directOrdersApi: "",
  },
  inventory: {
    // reconciliationMode: 'legacy' uses client-side FIFO; 'recon' defers to Cloud Function with tracking
    reconciliationMode: 'recon' as 'legacy' | 'recon'
  },
  paypal: {
    // Production should load the live client ID from the Cloud Function config endpoint
    clientId: '',
    sandbox: false,
    // Production should call the Cloud Functions base URL directly
    apiUrl: 'https://asia-east1-jasperpos-1dfd5.cloudfunctions.net'
  }
};

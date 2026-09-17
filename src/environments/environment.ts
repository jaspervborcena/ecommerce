// Development environment configuration for shaotang-74c95

export const environment = {
  production: false,
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

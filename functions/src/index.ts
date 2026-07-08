import functions from 'firebase-functions';
import integrationsApp from './integrations.js';

// Expose the integrations express app as a single HTTPS function
export const integrations = functions.https.onRequest(integrationsApp as any);


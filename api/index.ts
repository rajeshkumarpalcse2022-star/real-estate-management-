/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createApiApp } from '../server/apiApp';

// Vercel serverless entrypoint. All /api/* requests are rewritten here by vercel.json.
const app = createApiApp();

export default app;

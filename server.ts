/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApiApp } from './server/apiApp';

async function startServer() {
  const app = createApiApp();
  const server = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  // Vite middleware integration for dynamic Hot Module Replacement/Bundle execution
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[SaaS Server] Vite dev middleware attached successfully.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[SaaS Server] Serving production static files from dist/');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on port ${PORT}`);
    console.log(`[SaaS Server] Running and ready on http://0.0.0.0:${PORT}`);
  });
}

startServer();

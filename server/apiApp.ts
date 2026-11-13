/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import express, { type Express } from 'express';
import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || '';
const MONGODB_DB = process.env.MONGODB_DB || 'real_estate_management';
const STATE_COLLECTION = 'app_state';

// Reuse the MongoDB client across warm serverless invocations and local requests.
type MongoGlobal = typeof globalThis & {
  __mongoClientPromise?: Promise<MongoClient> | null;
};
const mongoGlobal = globalThis as MongoGlobal;

export async function getMongoDb(): Promise<Db> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured. Add it to your environment variables.');
  }
  if (!mongoGlobal.__mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    mongoGlobal.__mongoClientPromise = client.connect();
    mongoGlobal.__mongoClientPromise.catch(() => {
      mongoGlobal.__mongoClientPromise = null;
    });
  }
  const client = await mongoGlobal.__mongoClientPromise;
  return client.db(MONGODB_DB);
}

const isValidStateKey = (key: string) => /^[a-zA-Z0-9_-]+$/.test(key);

// CRM leads cache (module scope so it survives warm invocations)
let serverLeadsCache: any[] = [
  {
    id: 'LEAD-101',
    name: 'Marcus Sterling',
    address: '842 Highland Ave, West End, Metro City',
    phone: '+1 (555) 234-8901',
    email: 'm.sterling@sterlingcap.com',
    requirement: '3BHK Penthouse with Panoramic Terrace',
    budget: 1450000,
    interestedProperties: ['Grand Horizon Towers - Apt 1204', 'Grand Horizon Towers - Apt 802'],
    status: 'Negotiation',
    followupsCount: 4,
    lastFollowupDate: '2026-07-06',
    nextFollowupDate: '2026-07-10',
    notes: 'High intent VIP investor. Reviewing final payment milestones & parking stall allotment.',
    source: 'Website Inquiry',
    assignedAgent: 'Claire Standish',
    createdAt: '2026-06-15',
  },
  {
    id: 'LEAD-102',
    name: 'Victoria Thorne-Smith',
    address: '120 Royal Palm Blvd, Palm Cove',
    phone: '+1 (555) 789-4321',
    email: 'v.thorne@thornedynamics.org',
    requirement: 'Bespoke Luxury Smart Villa with Infinity Pool',
    budget: 2800000,
    interestedProperties: ['Aura Luxury Villas - Villa 04'],
    status: 'Site Visit Scheduled',
    followupsCount: 2,
    lastFollowupDate: '2026-07-05',
    nextFollowupDate: '2026-07-09',
    notes: 'Confirmed site inspection scheduled for Thursday 2 PM with her family architect.',
    source: 'Referral',
    assignedAgent: 'Sophia Vandervelde',
    createdAt: '2026-06-28',
  },
];

export function createApiApp(): Express {
  const app = express();

  // Body parsing middleware
  app.use(express.json());

  // API Check / Health Route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', server: 'express-vite-saas' });
  });

  // API Endpoint to get current environment database status
  app.get('/api/database/status', (req, res) => {
    res.json({
      configured: !!MONGODB_URI,
      driver: 'MongoDB',
      database: MONGODB_DB,
      dbEngine: MONGODB_URI ? 'MongoDB Atlas' : 'Local Offline Memory',
      databaseName: 'MongoDB Atlas',
    });
  });

  // API Endpoint to safely probe Supabase PostgreSQL connection (legacy)
  app.post('/api/database/test', async (req, res) => {
    const { supabaseUrl, supabaseKey, postgresUri } = req.body;
    const targetPostgresUri = postgresUri || process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const targetSupabaseUrl = supabaseUrl || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const targetSupabaseKey = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    // 1. Direct PostgreSQL Connection test (via pg library)
    if (targetPostgresUri && !targetPostgresUri.includes('*******')) {
      try {
        const { Pool } = await import('pg');
        const pool = new Pool({
          connectionString: targetPostgresUri,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 5000,
        });

        const client = await pool.connect();
        const dbRes = await client.query('SELECT version(), current_database(), current_user;');

        // Check existing tables
        const tablesRes = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `);

        client.release();
        await pool.end();

        return res.json({
          connected: true,
          type: 'postgres-direct',
          version: dbRes.rows[0]?.version?.split(' on ')[0] || 'PostgreSQL (Supabase Pooler)',
          database: dbRes.rows[0]?.current_database,
          user: dbRes.rows[0]?.current_user,
          tables: tablesRes.rows.map((r: any) => r.table_name),
          ok: 1,
        });
      } catch (e: any) {
        console.error('PostgreSQL testing probe failed:', e);
        return res.status(500).json({
          connected: false,
          type: 'postgres-direct',
          error: e.message || 'Unable to connect to PostgreSQL instance via connection string.',
        });
      }
    }

    // 2. Supabase REST API connection test
    if (targetSupabaseUrl && targetSupabaseKey && !targetSupabaseUrl.includes('placeholder')) {
      try {
        const cleanedUrl = targetSupabaseUrl.replace(/\/+$/, '');
        // Probe Supabase REST endpoint
        const testRes = await fetch(`${cleanedUrl}/rest/v1/?apikey=${targetSupabaseKey}`, {
          method: 'GET',
          headers: {
            'apikey': targetSupabaseKey,
            'Authorization': `Bearer ${targetSupabaseKey}`,
          },
        });

        if (testRes.ok || testRes.status === 200 || testRes.status === 404) {
          return res.json({
            connected: true,
            type: 'supabase-rest',
            version: 'PostgreSQL 15 (Supabase Cloud API)',
            url: cleanedUrl,
            ok: 1,
          });
        } else {
          const errText = await testRes.text();
          return res.status(400).json({
            connected: false,
            type: 'supabase-rest',
            error: `Supabase returned HTTP ${testRes.status}: ${errText.slice(0, 150)}`,
          });
        }
      } catch (e: any) {
        console.error('Supabase REST probe failed:', e);
        return res.status(500).json({
          connected: false,
          type: 'supabase-rest',
          error: e.message || 'Unable to reach Supabase API endpoint. Verify your Supabase URL and network.',
        });
      }
    }

    return res.status(400).json({
      connected: false,
      error: 'Please provide either a PostgreSQL Connection URI (DATABASE_URL) or Supabase Project URL & Anon/Service Key.',
    });
  });

  // Backwards compatibility alias for previous endpoint
  app.post('/api/supabase/test', (req, res) => {
    res.redirect(307, '/api/database/test');
  });

  // ============================================================
  // MONGODB PERSISTENCE API
  // ============================================================

  // Connection status / ping
  app.get('/api/mongodb/status', async (req, res) => {
    if (!MONGODB_URI) {
      return res.status(400).json({
        connected: false,
        driver: 'MongoDB',
        database: MONGODB_DB,
        error: 'MONGODB_URI is not configured in .env',
      });
    }
    try {
      const db = await getMongoDb();
      await db.command({ ping: 1 });
      const docs = await db
        .collection(STATE_COLLECTION)
        .find({}, { projection: { _id: 1, updatedAt: 1 } })
        .toArray();
      res.json({
        connected: true,
        driver: 'MongoDB',
        database: MONGODB_DB,
        collections: docs.map(d => d._id),
        count: docs.length,
      });
    } catch (e: any) {
      res.status(500).json({
        connected: false,
        driver: 'MongoDB',
        database: MONGODB_DB,
        error: e.message || 'Unable to connect to MongoDB.',
      });
    }
  });

  // Connection test (accepts an optional custom URI in the body)
  app.post('/api/mongodb/test', async (req, res) => {
    const uri = req.body?.uri || MONGODB_URI;
    if (!uri) {
      return res.status(400).json({ connected: false, error: 'No MongoDB URI provided.' });
    }
    const started = Date.now();
    let client: MongoClient | null = null;
    try {
      client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
      await client.connect();
      const db = client.db(MONGODB_DB);
      await db.command({ ping: 1 });
      const buildInfo = await db.admin().command({ buildInfo: 1 });
      const collections = (await db.listCollections().toArray()).map(c => c.name);
      res.json({
        connected: true,
        driver: 'MongoDB',
        database: MONGODB_DB,
        version: buildInfo.version,
        latencyMs: Date.now() - started,
        collections,
      });
    } catch (e: any) {
      res.status(500).json({
        connected: false,
        driver: 'MongoDB',
        error: e.message || 'Unable to connect to MongoDB.',
      });
    } finally {
      if (client) await client.close().catch(() => {});
    }
  });

  // Read every collection key stored in app_state
  app.get('/api/db', async (req, res) => {
    try {
      const db = await getMongoDb();
      const docs = await db.collection(STATE_COLLECTION).find({}).toArray();
      const state: Record<string, any> = {};
      for (const doc of docs) state[String(doc._id)] = doc.data;
      res.json({ success: true, data: state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Read a single collection key
  app.get('/api/db/:key', async (req, res) => {
    const { key } = req.params;
    if (!isValidStateKey(key)) {
      return res.status(400).json({ success: false, error: 'Invalid collection key.' });
    }
    try {
      const db = await getMongoDb();
      const doc = await db.collection(STATE_COLLECTION).findOne({ _id: key as any });
      if (!doc) return res.status(404).json({ success: false, error: 'Collection not found.' });
      res.json({ success: true, data: doc.data, updatedAt: doc.updatedAt });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Upsert a collection key with the provided full dataset
  app.put('/api/db/:key', async (req, res) => {
    const { key } = req.params;
    if (!isValidStateKey(key)) {
      return res.status(400).json({ success: false, error: 'Invalid collection key.' });
    }
    const data = req.body && 'data' in req.body ? req.body.data : req.body;
    if (data === undefined) {
      return res.status(400).json({ success: false, error: 'Missing "data" payload.' });
    }
    try {
      const db = await getMongoDb();
      const updatedAt = new Date();
      await db.collection(STATE_COLLECTION).updateOne(
        { _id: key as any },
        { $set: { data, updatedAt } },
        { upsert: true }
      );
      res.json({ success: true, key, updatedAt });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Delete a collection key
  app.delete('/api/db/:key', async (req, res) => {
    const { key } = req.params;
    if (!isValidStateKey(key)) {
      return res.status(400).json({ success: false, error: 'Invalid collection key.' });
    }
    try {
      const db = await getMongoDb();
      await db.collection(STATE_COLLECTION).deleteOne({ _id: key as any });
      res.json({ success: true, key });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // ============================================================
  // CRM LEADS API ENDPOINTS
  // ============================================================

  app.get('/api/leads', (req, res) => {
    res.json({ success: true, count: serverLeadsCache.length, data: serverLeadsCache });
  });

  app.post('/api/leads', (req, res) => {
    const newLead = {
      id: req.body.id || `LEAD-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString().split('T')[0],
      ...req.body,
    };
    serverLeadsCache.unshift(newLead);
    res.status(201).json({ success: true, lead: newLead });
  });

  app.put('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const index = serverLeadsCache.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    serverLeadsCache[index] = { ...serverLeadsCache[index], ...req.body };
    res.json({ success: true, lead: serverLeadsCache[index] });
  });

  app.delete('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    serverLeadsCache = serverLeadsCache.filter(l => l.id !== id);
    res.json({ success: true, message: `Lead ${id} deleted` });
  });

  app.post('/api/leads/:id/convert', (req, res) => {
    const { id } = req.params;
    const { propertyId, dealValue } = req.body;
    const lead = serverLeadsCache.find(l => l.id === id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    lead.status = 'Converted';
    lead.convertedAt = new Date().toISOString().split('T')[0];
    lead.convertedPropertyId = propertyId;
    lead.dealValue = dealValue || lead.budget;
    lead.convertedClientId = `CLI-${Math.floor(100 + Math.random() * 900)}`;

    res.json({
      success: true,
      message: `Lead ${lead.name} successfully converted to official client!`,
      lead,
    });
  });

  return app;
}

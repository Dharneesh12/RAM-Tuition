import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

let dbInstance = null;
let isMock = false;

// Check if PostgreSQL is available
const checkDatabaseConnection = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('⚠️ DATABASE_URL is not set. Falling back to Mock In-Memory Database.');
    isMock = true;
    return null;
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 3000, // 3 seconds timeout
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    const db = drizzle(client, { schema });
    dbInstance = db;
    isMock = false;
    return db;
  } catch (error) {
    console.warn(`⚠️ PostgreSQL Connection Failed: ${error.message}`);
    console.warn('🔄 Falling back to Mock In-Memory Database.');
    isMock = true;
    try {
      await client.end();
    } catch (e) {}
    return null;
  }
};

const db = await checkDatabaseConnection();

export { db, isMock };
export * as schema from './schema.js';

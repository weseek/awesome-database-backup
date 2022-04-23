import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { postgresqlConfig } from './config/postgresql';

export const testPGName = `dummy-${uuidv4()}`;
const dbConfig = postgresqlConfig;

export async function cleanTestPG(): Promise<void> {
  const pool = new Pool(dbConfig);
  const client = await pool.connect();
  await client.query(`DROP DATABASE IF EXISTS "${testPGName}"`);
  await client.query(`CREATE DATABASE "${testPGName}" TEMPLATE template0`);
  client.release();
  await pool.end();
}

export async function prepareTestPG(): Promise<void> {
  await cleanTestPG();

  const pool = new Pool({
    ...dbConfig,
    database: testPGName,
  });
  const client = await pool.connect();
  await client.query('CREATE TABLE IF NOT EXISTS dummy (id INT)');
  client.release();
  await pool.end();
}

export async function listTableNamesInTestPG(): Promise<Array<string>> {
  const pool = new Pool({
    ...dbConfig,
    database: testPGName,
  });
  const client = await pool.connect();
  // ref. https://flaviocopes.com/postgres-how-to-list-tables-database/
  const res = await client.query('\
    SELECT table_name \
    FROM information_schema.tables \
    WHERE table_schema = \'public\' \
    ORDER BY table_name \
  ');
  client.release();
  await pool.end();

  const tableNames = res.rows.map(row => row.table_name);
  return tableNames;
}

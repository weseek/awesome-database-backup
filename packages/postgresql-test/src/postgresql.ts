import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { join, basename } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { postgresqlConfig } from './config/postgresql';

const { Bzip2 } = require('compressjs');
const tar = require('tar');
const tmp = require('tmp');

tmp.setGracefulCleanup();

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

export function createPGBackup(fileName: string): string {
  const sql = `
--
-- PostgreSQL database cluster dump
--

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS;






--
-- Databases
--

--
-- Database "${testPGName}" dump
--

--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2 (Debian 14.2-1.pgdg110+1)
-- Dumped by pg_dump version 14.2 (Debian 14.2-1.pgdg100+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ${testPGName}; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "${testPGName}" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'en_US.utf8';


ALTER DATABASE "${testPGName}" OWNER TO postgres;

\\connect -reuse-previous=on "dbname='${testPGName}'"

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dummy; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dummy (
    id integer
);


ALTER TABLE public.dummy OWNER TO postgres;

--
-- Data for Name: dummy; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dummy (id) FROM stdin;
\\.

--
-- PostgreSQL database dump complete
--

--
-- PostgreSQL database cluster dump complete
--

`;
  const tmpdir = tmp.dirSync({ unsafeCleanup: true });
  const sqlFilePath = join(tmpdir.name, fileName);
  const sqlTarballPath = join(tmpdir.name, `${fileName}.tar`);
  const sqlBackupedFilePath = join(tmpdir.name, `${fileName}.tar.bz2`);

  writeFileSync(sqlFilePath, sql);
  tar.c(
    {
      sync: true,
      file: sqlTarballPath,
      cwd: tmpdir.name,
    },
    [basename(sqlFilePath)],
  );
  writeFileSync(sqlBackupedFilePath, Bzip2.compressFile(readFileSync(sqlTarballPath)));

  return sqlBackupedFilePath;
}

import { v4 as uuidv4 } from 'uuid';
import { createPool, RowDataPacket } from 'mysql2/promise';
import { join, basename } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { mysqlConfig } from './config/mysql';

const { Bzip2 } = require('compressjs');
const tar = require('tar');
const tmp = require('tmp');

tmp.setGracefulCleanup();

export const testMySQLName = `dummy-${uuidv4()}`;
const dbConfig = mysqlConfig;

export async function cleanTestMySQL(): Promise<void> {
  const pool = createPool(dbConfig);
  await pool.query(`DROP DATABASE IF EXISTS \`${testMySQLName}\``);
  await pool.query(`CREATE DATABASE \`${testMySQLName}\``);
  pool.end();
}

export async function prepareTestMySQL(): Promise<void> {
  await cleanTestMySQL();

  const pool = createPool({
    ...dbConfig,
    database: testMySQLName,
  });
  await pool.query('CREATE TABLE IF NOT EXISTS dummy (id INT)');
  pool.end();
}

export async function listTableNamesInTestMySQL(): Promise<Array<string>> {
  const pool = createPool({
    ...dbConfig,
    database: testMySQLName,
  });
  const [rows] = await pool.query('\
    SHOW TABLES \
  ');
  pool.end();

  const tableNames = (rows as RowDataPacket[]).map(row => row.name);
  return tableNames;
}

export function createMySQLBackup(fileName: string): string {
  const sql = `
-- MySQL dump 10.19  Distrib 10.3.34-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: mariadb    Database: dummy
-- ------------------------------------------------------
-- Server version       10.8.2-MariaDB-1:10.8.2+maria~focal

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table \`${testMySQLName}\`
--

DROP TABLE IF EXISTS \`${testMySQLName}\`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE \`${testMySQLName}\` (
  \`id\` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table \`${testMySQLName}\`
--

LOCK TABLES \`${testMySQLName}\` WRITE;
/*!40000 ALTER TABLE \`${testMySQLName}\` DISABLE KEYS */;
/*!40000 ALTER TABLE \`${testMySQLName}\` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-05-17  2:10:49
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

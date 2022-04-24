import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';
import { BSON } from 'bsonfy';
import { join, basename } from 'path';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { mongodbURI } from './config/mongodb';

const { Bzip2 } = require('compressjs');
const tar = require('tar');
const tmp = require('tmp');

// tmp.setGracefulCleanup();

export const testMongoDBName = `dummy-${uuidv4()}`;
const client = new MongoClient(mongodbURI);

export async function dropTestMongoDB(): Promise<void> {
  await client.connect();
  await client.db(testMongoDBName).dropDatabase();
  await client.close();
}

export async function prepareTestMongoDB(): Promise<void> {
  await client.connect();
  await client.db(testMongoDBName).dropDatabase();
  await client.db(testMongoDBName).createCollection('dummy');
  await client.close();
}

export async function listCollectionNamesInTestMongoDB(): Promise<Array<string>> {
  await client.connect();
  const collections = await client.db(testMongoDBName).collections();
  await client.close();
  return collections.map(collection => collection.collectionName);
}

export function createMongoDBBackup(fileName: string): string {
  const doc = {
    _id: '62406954e06d93aeef39f23c',
    test: 'test',
  };
  const docMetadata = {
    indexes: [
      {
        v: {
          $numberInt: '2',
        },
        key: {
          _id: {
            $numberInt: '1',
          },
        },
        name: '_id_',
      },
    ],
    uuid: 'c7d0dfe21d644a36bf773aad7a6f9671',
    collectionName: 'dummy',
    type: 'collection',
  };
  const tmpdir = tmp.dirSync({ unsafeCleanup: true });
  const docTopDirPath = join(tmpdir.name, testMongoDBName);
  const docDirPath = join(docTopDirPath, testMongoDBName);
  mkdirSync(docDirPath, { recursive: true });
  const docFilePath = join(docDirPath, 'dummy.bson');
  const docMetaFilePath = join(docDirPath, 'dummy.metadata.json');
  const docTarballPath = join(tmpdir.name, `${fileName}.tar`);
  const docBackupedFilePath = join(tmpdir.name, `${fileName}.tar.bz2`);

  writeFileSync(docFilePath, BSON.serialize(doc));
  writeFileSync(docMetaFilePath, JSON.stringify(docMetadata));
  tar.c(
    {
      sync: true,
      file: docTarballPath,
      cwd: tmpdir.name,
    },
    [basename(docTopDirPath)],
  );
  writeFileSync(docBackupedFilePath, Bzip2.compressFile(readFileSync(docTarballPath)));

  return docBackupedFilePath;
}

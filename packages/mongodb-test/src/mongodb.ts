import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';
import { mongodbURI } from './config/mongodb';

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

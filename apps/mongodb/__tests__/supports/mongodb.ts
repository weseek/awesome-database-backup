import { exec as execOriginal } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execOriginal);

export const testMongoDBName = 'dummy';

export async function dropTestMongoDB(): Promise<void> {
  await exec(`mongosh mongodb://root:password@mongo/${testMongoDBName}?authSource=admin --eval "db.dropDatabase()"`);
}

export async function prepareTestMongoDB(): Promise<void> {
  await dropTestMongoDB();
  await exec(`mongosh mongodb://root:password@mongo/${testMongoDBName}?authSource=admin --eval "db.dummy.insert({ dummy: 'dummy' })"`);
}

export async function listCollectionNamesInTestMongoDB(): Promise<Array<string>> {
  const { stdout, stderr } = await exec(`
      mongosh \
      mongodb://root:password@mongo/dummy?authSource=admin \
      --eval "JSON.stringify(db.getCollectionNames())" \
      --quiet \
  `);
  if (stderr) {
    console.log(stderr);
  }
  const collectionNames = JSON.parse(stdout);
  return collectionNames;
}

// import { IProvider, generateProvider } from '@awesome-backup/core'
// import { stat, readFileSync, writeFileSync } from 'fs';

// export class MongoDBAwesomeBackup {
//   provider: IProvider;

//   constructor(backupTo: string) {
//     try {
//       this.provider = generateProvider(backupTo);
//     } catch(e) {
//       throw new Error(`Cannot generate factory: ${e}`);
//     }
//   }

//   backup(backupTo: string): Promise<void> {
//     const tempFile = '/tmp/temp';
//     writeFileSync('/tmp/temp', 'temp');
//     this.provider.copyFile(tempFile, backupTo);
//   }
// }

import { IBackup } from '@awesome-backup/core'

export class MongoDBAwesomeBackup implements IBackup {
  exists(url: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  listFiles(url: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  deleteFile(url: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  copyFiles(copyFrom: string, copyTo: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

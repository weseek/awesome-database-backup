import { IProvider } from '@awesome-backup/core/interfaces/provider'

export class GCSProvider implements IProvider {
  exists(url: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  listFiles(url: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  deleteFile(url: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  copyFile(copySource: string, copyDestination: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

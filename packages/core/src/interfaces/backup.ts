export interface IBackup {
  exists(url: string): Promise<boolean>,
  listFiles(url: string): Promise<string>,
  deleteFile(url: string): Promise<void>,
  copyFiles(copyFrom: string, copyTo: string): Promise<void>,
}

export interface IProvider {
  exists(url: string): Promise<boolean>,
  listFiles(url: string, optionsRequired?: Record<string, boolean>): Promise<string[]>,
  deleteFile(url: string): Promise<void>,
  copyFile(copySource: string, copyDestination: string): Promise<void>,
}

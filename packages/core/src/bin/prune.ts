import { format, subDays } from 'date-fns';
import { IProvider } from '../interfaces/provider';
import { ICommonCLIOption } from './common';

/* Prune command option types */
export declare interface IPruneCLIOption extends ICommonCLIOption {
  backupfilePrefix: string,
  deleteDivide: number,
  deleteTargetDaysLeft: number,
}

export class PruneCLI {

  provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  async main(targetBucketUrl: URL, options: IPruneCLIOption): Promise<void> {
    const secondsPerDay = 60 * 60 * 24;
    const targetBackupDay = subDays(Date.now(), options.deleteTargetDaysLeft);
    const isDeleteBackupDay = (Math.trunc(targetBackupDay.getTime() / 1000 / secondsPerDay) % options.deleteDivide === 0);
    if (!isDeleteBackupDay) {
      // do nothing
      return;
    }

    const targetBackupUrlPrefix = new URL(`${options.backupfilePrefix}-${format(targetBackupDay, 'yyyyMMdd')}`, targetBucketUrl).toString();
    const targetBackupFiles = await this.provider.listFiles(targetBackupUrlPrefix, { exactMatch: false, absolutePath: false });
    for (const targetBackup of targetBackupFiles) {
      const targetBackupUrl = new URL(targetBackup, targetBucketUrl);
      this.provider.deleteFile(targetBackupUrl.toString());
      console.log(`DELETED past backuped file on ${this.provider.name}: ${targetBackupUrl}`);
    }
  }

}

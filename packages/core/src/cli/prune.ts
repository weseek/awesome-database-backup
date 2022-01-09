import { format, subDays } from 'date-fns';
import { generateProvider } from '../factories/provider-factory';

/* Prune command option types */
export declare interface IPruneCLIOption {
  awsRegion: string
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  backupfilePrefix: string,
  deleteDivide: number,
  deleteTargetDaysLeft: number,
}

export class PruneCLI {

  async main(targetBucketUrl: URL, options: IPruneCLIOption): Promise<void> {
    const secondsPerDay = 60 * 60 * 24;
    const targetBackupDay = subDays(Date.now(), options.deleteTargetDaysLeft);
    const isDeleteBackupDay = (Math.trunc(targetBackupDay.getTime() / 1000 / secondsPerDay) % options.deleteDivide === 0);
    if (!isDeleteBackupDay) {
      // do nothing
      return;
    }

    const provider = generateProvider(targetBucketUrl);
    const targetBackupUrlPrefix = new URL(`${options.backupfilePrefix}-${format(targetBackupDay, 'yyyyMMdd')}`, targetBucketUrl).toString();
    const targetBackupFiles = await provider.listFiles(targetBackupUrlPrefix, { exactMatch: false, absolutePath: false });
    for (const targetBackup of targetBackupFiles) {
      const targetBackupUrl = new URL(targetBackup, targetBucketUrl);
      provider.deleteFile(targetBackupUrl.toString());
      console.log(`DELETED past backuped file on ${provider.name}: ${targetBackupUrl}`);
    }
  }

}

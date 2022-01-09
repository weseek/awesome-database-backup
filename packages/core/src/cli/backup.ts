import { format } from 'date-fns';
import { basename, join } from 'path';
import { generateProvider } from '../factories/provider-factory';
import { compress } from '../utils/tar';

const schedule = require('node-schedule');
const tmp = require('tmp');

/* Backup command option types */
export declare interface IBackupCLIOption {
  awsRegion: string
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
  backupfilePrefix: string,
  cronmode: boolean,
  cronExpression: string,
}

export class AbstractBackupCLI {

  convertOption(option: IBackupCLIOption): Record<string, string|number|boolean|string[]|number[]> {
    throw new Error('Method not implemented.');
  }

  async backup(destinationPath: string, pgdumpRequiredOptions?: Record<string, string|number|boolean|string[]|number[]>): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async main(targetBucketUrl: URL, options: IBackupCLIOption): Promise<void> {
    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });

    console.log(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);
    const target = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}`);

    const provider = generateProvider(targetBucketUrl);
    const toolOption = this.convertOption(options);
    const [stdout, stderr] = await this.backup(target, toolOption);
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.warn(stderr);
    }
    console.log(`backup ${target}...`);
    const { compressedFilePath } = await compress(target);
    await provider.copyFile(compressedFilePath, targetBucketUrl.toString());
  }

  async mainCronMode(targetBucketUrl: URL, options: IBackupCLIOption): Promise<void> {
    console.log(`=== started in cron mode ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);
    await schedule.scheduleJob(options.cronExpression, async() => { await this.main(targetBucketUrl, options) });
  }

}

import { format } from 'date-fns';
import { basename, join } from 'path';
import { compress } from '../utils/tar';
import { IProvider } from '../interfaces/provider';
import { ICommonCLIOption } from './common';

const schedule = require('node-schedule');
const tmp = require('tmp');
const axios = require('axios');
const axiosRetry = require('axios-retry');
const EventEmitter = require('events');

const backupEmitter = new EventEmitter();
const _EXIT_BACKUP = 'AWSOME_BACKUP_EXIT_BACKUP';

/* Backup command option types */
export declare interface IBackupCLIOption extends ICommonCLIOption {
  backupfilePrefix: string,
  cronmode: boolean,
  cronExpression: string,
  healthchecksUrl: string,
}

export class AbstractBackupCLI {

  provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  convertOption(option: IBackupCLIOption): Record<string, string|number|boolean|string[]|number[]> {
    throw new Error('Method not implemented.');
  }

  async backup(destinationPath: string, pgdumpRequiredOptions?: Record<string, string|number|boolean|string[]|number[]>): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async main(targetBucketUrl: URL, options: IBackupCLIOption): Promise<void> {
    if (options.healthchecksUrl != null && backupEmitter.listenerCount(_EXIT_BACKUP) === 0) {
      const healthchecksUrl = new URL(options.healthchecksUrl);
      axiosRetry(axios, { retries: 3 });
      backupEmitter.addListener(_EXIT_BACKUP, async() => {
        await axios.get(healthchecksUrl.toString()).catch(((e: any) => { console.log(`Cannot GET ${healthchecksUrl.toString()}: ${e.toString()}`) }));
      });
    }

    tmp.setGracefulCleanup();
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });

    console.log(`=== ${basename(__filename)} started at ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);
    const target = join(tmpdir.name, `${options.backupfilePrefix}-${format(Date.now(), 'yyyyMMddHHmmss')}`);

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
    await this.provider.copyFile(compressedFilePath, targetBucketUrl.toString());

    backupEmitter.emit(_EXIT_BACKUP);
  }

  async mainCronMode(targetBucketUrl: URL, options: IBackupCLIOption): Promise<void> {
    console.log(`=== started in cron mode ${format(Date.now(), 'yyyy/MM/dd HH:mm:ss')} ===`);
    await schedule.scheduleJob(options.cronExpression, async() => { await this.main(targetBucketUrl, options) });
  }

}

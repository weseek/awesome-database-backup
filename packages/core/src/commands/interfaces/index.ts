import {
  S3StorageServiceClientConfig,
  GCSStorageServiceClientConfig,
} from '../../storage-service-clients/interfaces';

/* Common command option types */
export type ICommonCLIOption = S3StorageServiceClientConfig & GCSStorageServiceClientConfig;

/* Backup command option types */
export interface IBackupCLIOption extends ICommonCLIOption {
  backupfilePrefix: string,
  cronmode?: boolean,
  cronExpression?: string,
  healthchecksUrl?: string,
  backupToolOptions?: string,
}

/* Restore command option types */
export interface IRestoreCLIOption extends ICommonCLIOption {
  restoreToolOptions: string,
}

/* Prune command option types */
export type IListCLIOption = ICommonCLIOption

/* Prune command option types */
export interface IPruneCLIOption extends ICommonCLIOption {
  backupfilePrefix: string,
  deleteDivide: number,
  deleteTargetDaysLeft: number,
}

import {
  S3StorageServiceClientConfig,
  GCSStorageServiceClientConfig,
} from '@awesome-database-backup/storage-service-clients';

/* Common command option types */
export type ICommonCommandOption =
  {
    targetBucketUrl: URL,
  }
  & S3StorageServiceClientConfig
  & GCSStorageServiceClientConfig;

/* Backup command option types */
export interface IBackupCommandOption extends ICommonCommandOption {
  backupfilePrefix: string,
  cronmode?: string,
  healthchecksUrl?: URL,
  backupToolOptions?: string,
}

/* Restore command option types */
export interface IRestoreCommandOption extends ICommonCommandOption {
  restoreToolOptions?: string,
}

/* Prune command option types */
export type IListCommandOption = ICommonCommandOption

/* Prune command option types */
export interface IPruneCommandOption extends ICommonCommandOption {
  backupfilePrefix: string,
  deleteDivide: number,
  deleteTargetDaysLeft: number,
}

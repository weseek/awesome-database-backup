/**
 * `tar` command wrapper
 */
import { basename, dirname, join } from 'path';
import { exec } from 'child_process';

/**
 * Compress the specified file or directory in bzip2 format,
 * and save it in the same folder as "<name>.tar.bz2".
 *
 * If the compression succeeds, it returns the path to the compressed file.
 *
 * @param compressTargetPath - file or directory to compress
 * @returns path to the compressed file
 */
export function compressBZIP2(
    compressTargetPath: string,
): Promise<{ stdout: string, stderr: string, compressedFilePath: string }> {
  const compressTargetFilename = basename(compressTargetPath);
  const compressTargetDirPath = dirname(compressTargetPath);
  const compressedFilePath = `${compressTargetPath}.tar.bz2`;

  return new Promise((resolve, reject) => {
    exec(
      `tar -jcv -f ${compressedFilePath} -C ${compressTargetDirPath} ${compressTargetFilename}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        resolve({ stdout, stderr, compressedFilePath });
      },
    );
  });
}

/**
 * Extracts the specified bzip2 format compressed file to the same directory.
 *
 * If the expantion succeeds, it returns the path to the expaneded file or directory.
 *
 * @param expandTargetPath - file to expand
 * @returns path to the expaneded file
 */
export function expandBZIP2(
    expandTargetPath: string,
): Promise<{ stdout: string, stderr: string, expandedPath: string }> {
  const expandTargetDirPath = dirname(expandTargetPath);

  return new Promise((resolve, reject) => {
    exec(
      `tar -jxv -f ${expandTargetPath} -C ${expandTargetDirPath}`,
      (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        /**
         * It is assumed that the directory has been compressed and the file names have not changed.
         * (ex. "some.tar.gz" expands "some" directory)
         */
        const expandedPath = join(dirname(expandTargetPath), basename(expandTargetPath, '.tar.bz2'));
        resolve({ stdout, stderr, expandedPath });
      },
    );
  });
}

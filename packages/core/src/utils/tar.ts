import { basename, dirname, join } from 'path';
import { execute } from './cli';

const command = 'tar';

export async function compress(compressTargetPath: string): Promise<Record<string, string>> {
  const compressedFilePath = `${compressTargetPath}.tar.bz2`;
  const tarOptions = `-jcv -f ${compressedFilePath} -C ${dirname(compressTargetPath)}`;
  return new Promise((resolve, reject) => {
    execute(command, basename(compressTargetPath), tarOptions)
      .then(() => resolve({ compressedFilePath }))
      .catch(e => reject(e));
  });
}

export async function expand(expandTargetPath: string): Promise<Record<string, string>> {
  const tarOptions = `-jxv -f ${expandTargetPath} -C ${dirname(expandTargetPath)}`;
  /**
   * It is assumed that the directory has been compressed and the file names have not changed.
   * (ex. "some.tar.gz" expands "some" directory)
   */
  const expandedPath = join(dirname(expandTargetPath), basename(expandTargetPath, '.tar.bz2'));
  return new Promise((resolve, reject) => {
    execute(command, '', tarOptions)
      .then(() => resolve({ expandedPath }))
      .catch(e => reject(e));
  });
}

import { basename, dirname, join } from 'path';
import { execute } from './cli-option';

const command = 'tar';

export async function compress(compressTargetPath: string): Promise<Record<string, string>> {
  const compressedFilePath = `${compressTargetPath}.tar.bz2`;
  const tarOption = {
    '-j': true,
    '-c': true,
    '-v': true,
    '-f': compressedFilePath,
    '-C': dirname(compressTargetPath), // This is set to treat all paths to be compressed as the current path.
  };
  return new Promise((resolve, reject) => {
    execute(command, [basename(compressTargetPath)], tarOption)
      .then(() => resolve({ compressedFilePath }))
      .catch(e => reject(e));
  });
}

export async function expand(expandTargetPath: string): Promise<Record<string, string>> {
  const tarOption = {
    '-j': true,
    '-x': true,
    '-v': true,
    '-f': expandTargetPath,
    '-C': dirname(expandTargetPath),
  };
  /**
   * It is assumed that the directory has been compressed and the file names have not changed.
   * (ex. "some.tar.gz" expands "some" directory)
   */
  const expandedPath = join(dirname(expandTargetPath), basename(expandTargetPath, '.tar.bz2'));
  return new Promise((resolve, reject) => {
    execute(command, [], tarOption)
      .then(() => resolve({ expandedPath }))
      .catch(e => reject(e));
  });
}

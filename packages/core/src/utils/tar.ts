import { exec } from 'child_process';
import { basename, dirname, join } from 'path';

async function execute(tarOption: Record<string, string>, tarArguments: string[]): Promise<void> {
  const tarCommand = 'tar';
  const tarOptionsString = Object.keys(tarOption).map((key: string) => (tarOption[key] ? [key, tarOption[key]].join(' ') : key)).join(' ');
  const tarArgumentString = tarArguments.join(' ');
  return new Promise((resolve, reject) => {
    exec(`${tarCommand} ${tarOptionsString} ${tarArgumentString}`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

export async function compress(compressTargetPath: string): Promise<Record<string, string>> {
  const compressedFilePath = `${compressTargetPath}.tar.bz2`;
  const tarOption = {
    '-j': '',
    '-c': '',
    '-v': '',
    '-f': compressedFilePath,
    '-C': dirname(compressTargetPath), // This is set to treat all paths to be compressed as the current path.
  };
  return new Promise((resolve, reject) => {
    execute(tarOption, [basename(compressTargetPath)])
      .then(() => resolve({ compressedFilePath }))
      .catch(e => reject(e));
  });
}

export async function expand(expandTargetPath: string): Promise<Record<string, string>> {
  const tarOption = {
    '-j': '',
    '-x': '',
    '-v': '',
    '-f': expandTargetPath,
    '-C': dirname(expandTargetPath),
  };
  /**
   * It is assumed that the directory has been compressed and the file names have not changed.
   * (ex. "some.tar.gz" expands "some" directory)
   */
  const expandedPath = join(dirname(expandTargetPath), basename(expandTargetPath, '.tar.bz2'));
  return new Promise((resolve, reject) => {
    execute(tarOption, [])
      .then(() => resolve({ expandedPath }))
      .catch(e => reject(e));
  });
}

let tar = require('../../src/utils/tar');

const execMock = jest.fn().mockImplementation((command, callback) => {
  callback(null, 'stdout', 'stderr');
});

beforeEach(() => {
  jest.resetModules();
  jest.doMock('child_process', () => {
    const actual = jest.requireActual('child_process');
    return {
      ...actual,
      exec: execMock,
    };
  });
  tar = require('../../src/utils/tar');
});

describe('compressBZIP2', () => {
  it('call `tar` command with arguments and options', async() => {
    const compressTargetPath = '/path/to/file';

    await expect(tar.compressBZIP2(compressTargetPath)).resolves.toStrictEqual({
      compressedFilePath: '/path/to/file.tar.bz2',
      stdout: 'stdout',
      stderr: 'stderr',
    });
    expect(execMock).toBeCalledWith('tar -jcv -f /path/to/file.tar.bz2 -C /path/to file', expect.anything());
  });
});

describe('expandBZIP2', () => {
  it('call tar command with arguments and options', async() => {
    const expandTargetPath = '/path/to/file.tar.bz2';

    await expect(tar.expandBZIP2(expandTargetPath)).resolves.toStrictEqual({
      expandedPath: '/path/to/file',
      stdout: 'stdout',
      stderr: 'stderr',
    });
    expect(execMock).toBeCalledWith('tar -jxv -f /path/to/file.tar.bz2 -C /path/to', expect.anything());
  });
});

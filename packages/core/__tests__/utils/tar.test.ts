let tar = require('../../src/utils/tar');

describe('compress', () => {
  test('it call tar command with arguments and options', async() => {
    const compressTargetPath = '/path/to/file';
    const result = {
      stdout: 'stdout',
      stderr: 'stderr',
    };
    const executeMock = jest.fn().mockResolvedValue(result);
    jest.resetModules();
    jest.doMock('../../src/utils/cli', () => {
      const actual = jest.requireActual('../../src/utils/cli');
      return {
        ...actual,
        execute: executeMock,
      };
    });
    tar = require('../../src/utils/tar');

    await expect(tar.compress(compressTargetPath)).resolves.toStrictEqual({
      compressedFilePath: '/path/to/file.tar.bz2',
    });
    expect(executeMock).toBeCalledWith('tar', 'file', '-jcv -f /path/to/file.tar.bz2 -C /path/to');
  });
});

describe('expand', () => {
  test('it call tar command with arguments and options', async() => {
    const expandTargetPath = '/path/to/file.tar.bz2';
    const result = {
      stdout: 'stdout',
      stderr: 'stderr',
    };
    const executeMock = jest.fn().mockResolvedValue(result);
    jest.resetModules();
    jest.doMock('../../src/utils/cli', () => {
      const actual = jest.requireActual('../../src/utils/cli');
      return {
        ...actual,
        execute: executeMock,
      };
    });
    tar = require('../../src/utils/tar');

    await expect(tar.expand(expandTargetPath)).resolves.toStrictEqual({
      expandedPath: '/path/to/file',
    });
    expect(executeMock).toBeCalledWith('tar', '', '-jxv -f /path/to/file.tar.bz2 -C /path/to');
  });
});

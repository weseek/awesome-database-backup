import { ExecException } from 'child_process';

let cliOption = require('../../src/utils/cli-option');

const originalModule = jest.requireActual('child_process');
const childProcessModuleMock = {
  ...originalModule,
  exec: jest.fn().mockImplementation((
      command: string, callback?: ((error: ExecException | null, stdout: string, stderr: string) => void) | undefined,
  ): any => {
    if (callback) {
      callback(null, '', '');
    }
    return null;
  }),
};

describe('#execute', () => {

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('child_process', () => childProcessModuleMock);
    cliOption = require('../../src/utils/cli-option');
  });

  describe('when called with only "command"', () => {
    it('call "exec" with command', async() => {
      await cliOption.execute('command_name');
      expect(childProcessModuleMock.exec).toHaveBeenCalledWith('command_name  ', expect.any(Function));
    });
  });

  describe('when called with arguments', () => {
    it('call "exec" with command and arguments separated by space', async() => {
      await cliOption.execute('command_name', 'arg1');
      expect(childProcessModuleMock.exec).toHaveBeenCalledWith('command_name  arg1', expect.any(Function));
    });
  });

  describe('when called with option', () => {
    it('call "exec" with command and option separated by space', async() => {
      await cliOption.execute('command_name', '', '--opt1 value1');
      expect(childProcessModuleMock.exec).toHaveBeenCalledWith('command_name --opt1 value1 ', expect.any(Function));
    });
  });

  describe('when "exec" occur error', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.doMock('child_process', () => {
        return {
          ...originalModule,
          exec: jest.fn().mockImplementation((
              command: string, callback?: ((error: ExecException | null, stdout: string, stderr: string) => void) | undefined,
          ): any => {
            if (callback) {
              callback(new Error(), '', '');
            }
            return null;
          }),
        };
      });
      cliOption = require('../../src/utils/cli-option');
    });

    it('reject', async() => {
      await expect(cliOption.execute('command_name')).rejects.toThrowError();
    });
  });
});

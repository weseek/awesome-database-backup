import {
  vi, describe, it, expect, afterEach,
} from 'vitest';
import { StorageServiceClientCommand } from '../../src/commands/common';

describe('StorageServiceClientCommand', () => {
  describe('addStorageOptions', () => {
    it('return own instance and call option()', () => {
      const command = new StorageServiceClientCommand();
      vi.spyOn(command, 'addOption');
      expect(command.addStorageOptions()).toBe(command);
      expect(command.addOption).toBeCalled();
    });

    describe('--aws-force-path-style / AWS_FORCE_PATH_STYLE option', () => {
      afterEach(() => {
        delete process.env.AWS_FORCE_PATH_STYLE;
      });

      it('registers an option bound to the AWS_FORCE_PATH_STYLE env var, defaulting to false', () => {
        const command = new StorageServiceClientCommand();
        command.addStorageOptions();

        const option = command.options.find(opt => opt.attributeName() === 'awsForcePathStyle');
        expect(option).toBeDefined();
        expect(option?.long).toBe('--aws-force-path-style');
        expect(option?.envVar).toBe('AWS_FORCE_PATH_STYLE');
        expect(option?.defaultValue).toBe(false);
      });

      it('parses to false when neither the flag nor the env var is set', () => {
        const command = new StorageServiceClientCommand();
        // command.opts() is only reliable after parse() has run in commander
        // (defaults are applied during parsing).
        command.addStorageOptions().parse(['--target-bucket-url', 's3://bucket'], { from: 'user' });

        expect(command.opts().awsForcePathStyle).toBe(false);
      });

      it('parses to true when the --aws-force-path-style flag is passed', () => {
        const command = new StorageServiceClientCommand();
        command.addStorageOptions().parse(['--target-bucket-url', 's3://bucket', '--aws-force-path-style'], { from: 'user' });

        expect(command.opts().awsForcePathStyle).toBe(true);
      });

      it('parses to true when the AWS_FORCE_PATH_STYLE env var is set', () => {
        process.env.AWS_FORCE_PATH_STYLE = 'true';

        const command = new StorageServiceClientCommand();
        command.addStorageOptions().parse(['--target-bucket-url', 's3://bucket'], { from: 'user' });

        expect(command.opts().awsForcePathStyle).toBe(true);
      });
    });
  });

  describe('saveStorageClientInAdvance', () => {

    it('return own instance and call hook()', () => {
      const command = new StorageServiceClientCommand();
      vi.spyOn(command, 'hook');
      expect(command.saveStorageClientInAdvance()).toBe(command);
      expect(command.hook).toBeCalled();
    });
  });
});

import { MongoDBAwesomeBackup } from '../src';

describe('MongoDBAwesomeBackup', () => {
  describe('exists', () => {
    test('it is implemented', () => {
      const mab = new MongoDBAwesomeBackup();
      expect(typeof mab.exists).toBe('function');
    });
  });
});

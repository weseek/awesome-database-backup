const tmp = require('tmp');

class TempDir {

  tmpdir: { name: string };

  constructor() {
    tmp.setGracefulCleanup();
    this.tmpdir = tmp.dirSync({ unsafeCleanup: true });
  }

  clean() {
    this.tmpdir = tmp.dirSync({ unsafeCleanup: true });
  }

}

export default new TempDir();

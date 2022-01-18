import { EOL } from 'os';

import { IProvider } from '../interfaces/provider';

export class ListCLI {

  provider: IProvider;

  constructor(provider: IProvider) {
    this.provider = provider;
  }

  async main(targetBucketUrl: URL): Promise<void> {
    console.log('There are files below in bucket:');
    const files = await this.provider?.listFiles(targetBucketUrl.toString());
    console.log(files.join(EOL));
  }

}

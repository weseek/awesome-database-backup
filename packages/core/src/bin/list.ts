import { EOL } from 'os';

import { IStorageClient } from '../interfaces/storage-client';

export class ListCLI {

  provider: IStorageClient;

  constructor(provider: IStorageClient) {
    this.provider = provider;
  }

  async main(targetBucketUrl: URL): Promise<void> {
    console.log('There are files below in bucket:');
    const files = await this.provider?.listFiles(targetBucketUrl.toString());
    console.log(files.join(EOL));
  }

}

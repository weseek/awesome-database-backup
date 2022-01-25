import { EOL } from 'os';

import { IStorageServiceClient } from '../interfaces/storage-service-client';

export class ListCLI {

  provider: IStorageServiceClient;

  constructor(provider: IStorageServiceClient) {
    this.provider = provider;
  }

  async main(targetBucketUrl: URL): Promise<void> {
    console.log('There are files below in bucket:');
    const files = await this.provider?.listFiles(targetBucketUrl.toString());
    console.log(files.join(EOL));
  }

}

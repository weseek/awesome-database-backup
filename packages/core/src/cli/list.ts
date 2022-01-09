import { EOL } from 'os';
import { generateProvider } from '../factories/provider-factory';

/* List command option types */
export declare interface IListCLIOption {
  awsRegion: string
  awsAccessKeyId: string,
  awsSecretAccessKey: string,
}

export class ListCLI {

  async main(targetBucketUrl: URL): Promise<void> {
    console.log('There are files below in bucket:');

    const provider = generateProvider(targetBucketUrl);
    const files = await provider.listFiles(targetBucketUrl.toString());
    console.log(files.join(EOL));
  }

}

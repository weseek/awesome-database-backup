# core

Core module of awesome-backup modules.

## Usage

```
import { IBackup } from '@awesome-backup/core'

export class DBSpecificBackup implements IBackup {
  exists(url: string): Promise<boolean> {
    // implementation
  }
  listFiles(url: string): Promise<string> {
    // implementation
  }
  ... <snip>
}
```

import { appendFileSync } from 'node:fs';

import { consolidateDependabotBumps } from './consolidate';

const body = process.env.RELEASE_BODY ?? '';
const authors = process.env.AUTHORS?.split(',').map(author => author.trim()).filter(author => author.length > 0);
const result = consolidateDependabotBumps(body, authors != null && authors.length > 0 ? { authors } : {});

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput == null) {
  process.stdout.write(result);
}
else {
  const delimiter = `EOF_${Math.random().toString(36).slice(2)}`;
  appendFileSync(githubOutput, `body<<${delimiter}\n${result}\n${delimiter}\n`);
}

const BUMP_LINE_PATTERN = /^- (.+?): bump (\S+) from (\S+) to (\S+) \(#(\d+)\) @(.+)$/;

const DEFAULT_TARGET_AUTHORS = ['dependabot'];

type ParsedBump = {
  prefix: string,
  packageName: string,
  from: string,
  to: string,
  number: string,
  author: string,
};

export type ConsolidateDependabotBumpsOptions = {
  // Whitelist of author name substrings whose bump entries are eligible for consolidation.
  authors?: string[],
};

function parseBumpLine(line: string): ParsedBump | null {
  const match = line.match(BUMP_LINE_PATTERN);
  if (match == null) return null;

  const [, prefix, packageName, from, to, number, author] = match;
  return { prefix, packageName, from, to, number, author };
}

// Compares dot/hyphen-separated version segments numerically when possible,
// so that e.g. "3.1061.0" is correctly treated as greater than "3.1057.0".
function compareVersions(a: string, b: string): number {
  const aParts = a.split(/[.-]/);
  const bParts = b.split(/[.-]/);
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i++) {
    const aPart = aParts[i] ?? '0';
    const bPart = bParts[i] ?? '0';
    const aNum = Number(aPart);
    const bNum = Number(bPart);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      if (aNum !== bNum) return aNum - bNum;
      continue;
    }

    if (aPart !== bPart) return aPart < bPart ? -1 : 1;
  }

  return 0;
}

function groupKey(bump: ParsedBump): string {
  return JSON.stringify([bump.prefix, bump.packageName, bump.author]);
}

// Whether a bump entry's author is eligible for consolidation, matched by substring
// so that e.g. "dependabot" matches the "[dependabot[bot]](https://github.com/apps/dependabot)" author.
function isTargetAuthor(author: string, authors: readonly string[]): boolean {
  return authors.some(target => author.includes(target));
}

// Consolidates a contiguous run of changelog list items (lines starting with "- ").
// Bump entries for the same package/author are merged into a single line that
// spans from the lowest "from" version to the highest "to" version, listing all PR numbers.
// Only entries whose author matches one of `authors` are considered for consolidation.
function consolidateLines(lines: string[], authors: readonly string[]): string[] {
  const parsed = lines.map(parseBumpLine);

  const groups = new Map<string, number[]>();
  parsed.forEach((bump, index) => {
    if (bump == null) return;
    if (!isTargetAuthor(bump.author, authors)) return;
    const key = groupKey(bump);
    const indices = groups.get(key) ?? [];
    indices.push(index);
    groups.set(key, indices);
  });

  const consolidated: string[] = [];
  const merged = new Set<number>();

  for (const [index, line] of lines.entries()) {
    if (merged.has(index)) continue;

    const bump = parsed[index];
    if (bump == null || !isTargetAuthor(bump.author, authors)) {
      consolidated.push(line);
      continue;
    }

    const indices = groups.get(groupKey(bump)) as number[];
    if (indices.length === 1) {
      consolidated.push(line);
      continue;
    }

    const items = indices.map(i => parsed[i] as ParsedBump);
    const from = items.reduce((min, item) => (compareVersions(item.from, min) < 0 ? item.from : min), items[0].from);
    const to = items.reduce((max, item) => (compareVersions(item.to, max) > 0 ? item.to : max), items[0].to);
    const numbers = items.map(item => Number(item.number)).sort((a, b) => a - b).map(n => `#${n}`).join(', ');

    consolidated.push(`- ${bump.prefix}: bump ${bump.packageName} from ${from} to ${to} (${numbers}) @${bump.author}`);
    indices.forEach(i => merged.add(i));
  }

  return consolidated;
}

// Consolidates dependency bump entries within a release-drafter generated body.
// Each contiguous block of "- " list items (i.e. each category section) is processed independently.
export function consolidateDependabotBumps(body: string, options: ConsolidateDependabotBumpsOptions = {}): string {
  const authors = options.authors ?? DEFAULT_TARGET_AUTHORS;
  const lines = body.split('\n');
  const result: string[] = [];

  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith('- ')) {
      let j = i;
      while (j < lines.length && lines[j].startsWith('- ')) j++;
      result.push(...consolidateLines(lines.slice(i, j), authors));
      i = j;
      continue;
    }

    result.push(lines[i]);
    i++;
  }

  return result.join('\n');
}

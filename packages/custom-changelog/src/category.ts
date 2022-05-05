import RegexParser from 'regex-parser';
import { getLatestMergedPRAssociatedWithCommit } from './meta';

export type Category = {
  text?: string,
  changesetSummaryPatterns?: Array<string>,
  pullRequestLabels?: Array<string>,
}

export async function prefixSummary(summary: string, categories: Array<Category>, owner: string, repo: string, commitID: string)
    : Promise<string> {
  const summaryPatternMatcher = (pattern: string) => (RegexParser(pattern).exec(summary));

  const pr = await getLatestMergedPRAssociatedWithCommit(owner, repo, commitID);

  const labels = pr?.labels?.map(it => it.name);
  const labelMatcher = (target: string) => (labels?.includes(target));

  const prefixes: Array<string> = [];
  categories.forEach((c) => {
    if (
      (c.changesetSummaryPatterns && c.changesetSummaryPatterns.filter(summaryPatternMatcher).length > 0)
      || (c.pullRequestLabels && c.pullRequestLabels.filter(labelMatcher).length > 0)
    ) {
      prefixes.push(c.text || '');
    }
  });

  const prefixedSummary = (prefixes.length > 0 ? `[${prefixes.join(', ')}] ` : '') + summary;
  return prefixedSummary;
}

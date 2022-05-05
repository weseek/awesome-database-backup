import { Octokit } from '@octokit/rest';

const RegexParser = require('regex-parser');

export type Meta = {
  pull: number | null,
  commit: string | null,
  users: Array<string> | null,
}

export function replaceMeta(summary: string)
    : { meta: Meta, summary: string } {
  const meta: Meta = {
    pull: null,
    commit: null,
    users: null,
  };
  const processors = [
    /* Get Pull Request's info */
    {
      pattern: '/^\\s*(?:pr|pull|pull\\s+request):\\s*#?(\\d+)/im',
      process: (_: string, pr: string) => {
        const num = Number(pr);
        if (!Number.isNaN(num)) meta.pull = num;
        return '';
      },
    },
    /* Get Commit info */
    {
      pattern: '/^\\s*commit:\\s*([^\\s]+)/im',
      process: (_: string, commit: string) => {
        meta.commit = commit;
        return '';
      },
    },
    /* Get users info */
    {
      pattern: '/^\\s*(?:author|user):\\s*@?([^\\s]+)/gim',
      process: (_: string, user: string) => {
        meta.users = meta.users || [];
        meta.users.push(user);
        return '';
      },
    },
  ];

  let replacedSummary = summary;
  processors.forEach((p) => {
    replacedSummary = replacedSummary.replace(RegexParser(p.pattern), p.process);
  });
  replacedSummary = replacedSummary.trim();

  return {
    meta,
    summary: replacedSummary,
  };
}

export async function getMetaFromPullRequest(owner: string, repo: string, pull: number)
    : Promise<{ user: string | null; commit: string | null; }> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const pr = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pull,
  });

  return {
    user: pr.data.head.user.login,
    commit: pr.data.merge_commit_sha,
  };
}

export async function getMetaFromCommit(owner: string, repo: string, commitID: string, options = { withRelatedPullRequest: false })
    : Promise<{ pull: number | null; user: string | null; }> {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const commit = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: commitID,
  });
  const commitAuthor = commit.data.author?.name || null;

  let latestMergedPRNumber = null;
  if (options.withRelatedPullRequest) {
    const prs = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner,
      repo,
      commit_sha: commitID,
    });

    if (prs.data.length > 0) {
      const latestMergedPR = prs.data
        .filter(pr => pr.merged_at != null)
        .sort((prA, prB) => {
          const prAMergedAt = new Date(prA.merged_at as string);
          const prBMergedAt = new Date(prB.merged_at as string);
          return prAMergedAt.getTime() - prBMergedAt.getTime();
        })
        .at(0);
      latestMergedPRNumber = latestMergedPR?.number || null;
    }
  }

  return {
    pull: latestMergedPRNumber,
    user: commitAuthor,
  };
}

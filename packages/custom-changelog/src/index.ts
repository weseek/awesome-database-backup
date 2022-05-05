/* eslint-disable max-len */
import { ChangelogFunctions } from '@changesets/types';
import { getMetaFromCommit, getMetaFromPullRequest, replaceMeta } from './meta';
import { Category, prefixSummary } from './category';

type Options = {
  owner: string,
  repo: string,
  noThanksUsers?: Array<string>,
  categories?: Array<Category>,
}

const prLink = (owner: string, repo: string, pull: number) => `[#${pull}](https://github.com/${owner}/${repo}/pull/${pull})`;
const commitLink = (owner: string, repo: string, commit: string) => `[\`${commit}\`](https://github.com/${owner}/${repo}/commit/${commit})`;
const userLink = (user: string | null) => (user ? `[@${user}](https://github.com/${user})` : '');

function assertRequiredOptionPresence(options: Record<string, any> | null) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      'Please create a GitHub personal access token at https://github.com/settings/tokens/new'
      + ' and add it as the GITHUB_TOKEN environment variable',
    );
  }

  if (!options?.owner || !options?.repo) {
    throw new Error(
      'Please provide a owner and repo to this changelog generator like this:\n'
      + '"changelog": ["@changesets/changelog-github", { "owner": "org", "repo": "repo" }]',
    );
  }
}

const changelogFunctions: ChangelogFunctions = {

  /*
   * Return changelog's line for updated dependencies.
   * It return these format:
   * ```
   * - Update dependencies [$commitLink1, $commitLink2, ...]:"
   *   - $packageName@$newVersion
   * ```
   *
   * ex.
   * - Updated dependencies [[`27a5a82`](https://github.com/changesets/changesets/commit/27a5a82188914570d192162f9d045dfd082a3c15)]:
   *   - @changesets/types@4.1.0
   *
   * see. https://github.com/changesets/changesets/blob/main/packages/changelog-github/CHANGELOG.md
   */
  getDependencyReleaseLine: async(
      changesets,
      dependenciesUpdated,
      dangerOptions,
  ) => {
    if (dependenciesUpdated.length === 0) return '';

    assertRequiredOptionPresence(dangerOptions);
    const options: Options = dangerOptions as Options;

    const commitLinks = changesets
      .filter(cs => cs.commit != null)
      .map(cs => commitLink(options.owner, options.repo, cs.commit as string));

    const dependencyReleaseLines = [
      `- Updated dependencies [${commitLinks.join(', ')}]`,
      ...(dependenciesUpdated.map(dependency => (
        `  - ${dependency.name}@${dependency.newVersion}`
      ))),
    ]
      .join('\n');

    return dependencyReleaseLines;
  },

  /*
   * Return changelog's lines per changeset.
   * ```
   * - [#$PRLink] [$commitLink] Thanks @$userLink1, @$userLink2, ...! - $changesetSummary#L1"
   * changesetSummary#L2
   * changesetSummary#L3
   * ...
   * ```
   *
   * ex.
   * - [#564](https://github.com/changesets/changesets/pull/564) [`707002d`](https://github.com/changesets/changesets/commit/707002dec9332a2c1322522a23861e747a6bff6f) Thanks [@Andarist](https://github.com/Andarist)! - It's now possible to specify multiple authors of a change by using multiple `author: @someuser` lines.
   *
   * see. https://github.com/changesets/changesets/blob/main/packages/changelog-github/CHANGELOG.md
   */
  getReleaseLine: async(
      changeset,
      type,
      dangerOptions,
  ) => {
    assertRequiredOptionPresence(dangerOptions);
    const options: Options = dangerOptions as Options;

    const { meta: metaFromSummary, summary: replacedSummary } = replaceMeta(changeset.summary);
    const metaFromPR = metaFromSummary.pull
      ? await getMetaFromPullRequest(options.owner, options.repo, metaFromSummary.pull)
      : null;
    const commitID = metaFromSummary.commit || changeset.commit;
    const metaFromCommit = commitID
      ? await getMetaFromCommit(options.owner, options.repo, commitID, { withRelatedPullRequest: true })
      : null;

    const ignoreUsersFilter = ((it: any) => it != null && (options.noThanksUsers && options.noThanksUsers.indexOf(it) === -1));
    const meta = {
      pull: metaFromSummary.pull || metaFromCommit?.pull,
      commit: metaFromSummary.commit || metaFromPR?.commit || changeset.commit,
      users: [metaFromSummary.users || metaFromPR?.user || metaFromCommit?.user].flat().filter(ignoreUsersFilter),
    };

    const [firstLine, ...followingLines] = (
      options.categories
        ? await prefixSummary(replacedSummary, options.categories, options.owner, options.repo, meta.commit as string)
        : replacedSummary
    )
      .split('\n')
      .map(l => l.trimEnd());
    const newFirstLine = [
      firstLine,
      meta.pull ? `(${prLink(options.owner, options.repo, meta.pull)})` : null,
      (!meta.pull && meta.commit) ? `[${commitLink(options.owner, options.repo, meta.commit)}]` : null,
      meta.users.length > 0 ? `Thanks ${meta.users.map(it => userLink(it as string)).join(', ')}!` : null,
    ]
      .filter(it => it != null)
      .join(' ');
    const releaseLines = [
      '', // empty line
      '', // empty line
      `- ${newFirstLine}`,
      followingLines
        .map(l => `  ${l}`)
        .join('\n'),
    ]
      .join('\n');
    return releaseLines;
  },
};

export default changelogFunctions;

/* eslint-disable max-len */
import { ChangelogFunctions } from '@changesets/types';
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';

const changelogFunctions: ChangelogFunctions = {

  /*
   * Return changelog's line for updated dependencies
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
      options,
  ) => {
    if (!options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
      );
    }
    if (dependenciesUpdated.length === 0) return '';

    const changesetLink = `- Updated dependencies [${(
      await Promise.all(
        changesets.map(async(cs) => {
          if (cs.commit) {
            const { links } = await getInfo({
              repo: options.repo,
              commit: cs.commit,
            });
            return links.commit;
          }
        }),
      )
    )
      .filter(_ => _)
      .join(', ')}]:`;

    const updatedDepenenciesList = dependenciesUpdated.map(
      dependency => `  - ${dependency.name}@${dependency.newVersion}`,
    );

    return [changesetLink, ...updatedDepenenciesList].join('\n');
  },

  /*
   * Return changelog's line for Pull Request
   *
   * ex.
   * - [#564](https://github.com/changesets/changesets/pull/564) [`707002d`](https://github.com/changesets/changesets/commit/707002dec9332a2c1322522a23861e747a6bff6f) Thanks [@Andarist](https://github.com/Andarist)! - It's now possible to specify multiple authors of a change by using multiple `author: @someuser` lines.
   *
   * see. https://github.com/changesets/changesets/blob/main/packages/changelog-github/CHANGELOG.md
   *
   * [TYPES]
   *     type getReleaseLine(
   *         changeset: {
   *             // This is the string of the summary from the changeset markdown file
   *             summary: string
   *             // This is an array of information about what is going to be released. each is an object with name: the name of the package, and type, which is "major", "minor", or "patch"
   *             releases
   *             // the hash for the commit that introduced the changeset
   *             commit
   *         },
   *         // the type of the change this changeset refers to, as "major", "minor", or "patch"
   *         type
   *         // This needs to be explained - see @changesets/changelog-github's code for how this works
   *         changelogOpts
   *     ) => string
   */
  getReleaseLine: async(
      changeset,
      type,
      options,
  ) => {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
      );
    }

    let prFromSummary: number | undefined;
    let commitFromSummary: string | undefined;
    const usersFromSummary: string[] = [];
    const ignoredUsers = ['dependabot'];

    const replacedChangelog = changeset.summary
      .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
        const num = Number(pr);
        if (!Number.isNaN(num)) prFromSummary = num;
        return '';
      })
      .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
        commitFromSummary = commit;
        return '';
      })
      .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
        if (ignoredUsers.find(user)) return '';

        usersFromSummary.push(user);
        return '';
      })
      .trim();

    const [firstLine, ...futureLines] = replacedChangelog
      .split('\n')
      .map(l => l.trimRight());

    const links = await (async() => {
      if (prFromSummary !== undefined) {
        const { links } = await getInfoFromPullRequest({
          repo: options.repo,
          pull: prFromSummary,
        });
        return links;
      }

      const commitToFetchFrom = commitFromSummary || changeset.commit;
      if (commitToFetchFrom) {
        const { links } = await getInfo({
          repo: options.repo,
          commit: commitToFetchFrom,
        });
        return links;
      }

      return {
        commit: null,
        pull: null,
        user: null,
      };
    })();

    const users = usersFromSummary.length
      ? usersFromSummary
        .map(
          userFromSummary => `[@${userFromSummary}](https://github.com/${userFromSummary})`,
        )
        .join(', ')
      : links.user;

    const prefix = [
      links.pull === null ? '' : ` ${links.pull}`,
      links.commit === null ? '' : ` ${links.commit}`,
      users === null ? '' : ` Thanks ${users}!`,
    ].join('');

    return `\n\n-${prefix ? `${prefix} -` : ''} ${firstLine}\n${futureLines
      .map(l => `  ${l}`)
      .join('\n')}`;
  },
};

export default changelogFunctions;

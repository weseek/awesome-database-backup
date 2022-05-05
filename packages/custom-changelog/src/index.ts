/* eslint-disable max-len */
import { ChangelogFunctions } from '@changesets/types';
import { getInfo, getInfoFromPullRequest } from '@changesets/get-github-info';

type MetaFromPR = {
  user: string | null,
  commit: string | null
}
type MetaFromCommit = {
  user: string | null,
  pull: number | null
}
type Meta = {
  pull: number | null,
  commit: string | null,
  users: Array<string> | null,
}

function replaceMeta(summary: string) {
  const meta: Meta = {
    pull: null,
    commit: null,
    users: null,
  };
  const replacedSummary = summary
    .replace(/^\s*(?:pr|pull|pull\s+request):\s*#?(\d+)/im, (_, pr) => {
      const num = Number(pr);
      if (!Number.isNaN(num)) meta.pull = num;
      return '';
    })
    .replace(/^\s*commit:\s*([^\s]+)/im, (_, commit) => {
      meta.commit = commit;
      return '';
    })
    .replace(/^\s*(?:author|user):\s*@?([^\s]+)/gim, (_, user) => {
      meta.users = meta.users || [];
      meta.users.push(user);
      return '';
    })
    .trim();

  return {
    meta,
    summary: replacedSummary,
  };
}

async function getMetaFromGitHub(repo: string, meta: Meta, changesetCommit: string | undefined) {
  let metaFromPR: MetaFromPR = {
    user: null,
    commit: null,
  };
  let metaFromCommit: MetaFromCommit = {
    user: null,
    pull: null,
  };

  if (meta.pull) {
    const { user, commit } = await getInfoFromPullRequest({
      repo,
      pull: meta.pull,
    });
    metaFromPR = {
      user,
      commit,
    };
  }
  else {
    const commit = meta.commit || changesetCommit;
    if (commit) {
      const { user, pull } = await getInfo({
        repo,
        commit,
      });
      metaFromCommit = {
        user,
        pull,
      };
    }
  }
  return {
    metaFromPR,
    metaFromCommit,
  };
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
      options,
  ) => {
    if (!options || !options.repo) {
      throw new Error(
        'Please provide a repo to this changelog generator like this:\n"changelog": ["@changesets/changelog-github", { "repo": "org/repo" }]',
      );
    }

    const { meta: metaFromSummary, summary: replacedSummary } = replaceMeta(changeset.summary);
    const { metaFromPR, metaFromCommit } = await getMetaFromGitHub(options.repo, metaFromSummary, changeset.commit);

    const ignoreUsersFilter = ((it: any) => it != null && (options.ignoreUsers && options.ignoreUsers.indexOf(it) === -1));
    const meta = {
      pull: metaFromSummary.pull || metaFromCommit.pull,
      commit: metaFromSummary.commit || metaFromPR.commit || changeset.commit,
      users: [metaFromSummary.users || metaFromPR.user || metaFromCommit.user]
        .flat()
        .filter(ignoreUsersFilter),
    };

    const [firstLine, ...followLines] = replacedSummary
      .split('\n')
      .map(l => l.trimEnd());
    const links = {
      pull: meta.pull ? `[#${meta.pull}](https://github.com/${options.repo}/pull/${meta.pull})` : null,
      commit: meta.commit ? `[\`${meta.commit}\`](https://github.com/${options.repo}/commit/${meta.commit})` : null,
      users: meta.users.map(it => `[@${it}](https://github.com/${it})`).join(', '),
    };
    const newFirstLine = [
      links.pull,
      !links.pull ? links.commit : null,
      meta.users.length > 0 ? `Thanks ${links.users}!` : null,
      firstLine,
    ]
      .filter(it => it != null)
      .join(' ');
    const releaseLines = [
      '',
      '',
      `- ${newFirstLine}`,
      followLines
        .map(l => `  ${l}`)
        .join('\n'),
    ]
      .join('\n');
    return releaseLines;
  },
};

export default changelogFunctions;

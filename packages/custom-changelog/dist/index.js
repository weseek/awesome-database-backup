"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meta_1 = require("./meta");
const category_1 = require("./category");
const prLink = (owner, repo, pull) => `[#${pull}](https://github.com/${owner}/${repo}/pull/${pull})`;
const commitLink = (owner, repo, commit) => `[\`${commit}\`](https://github.com/${owner}/${repo}/commit/${commit})`;
const userLink = (user) => (user ? `[@${user}](https://github.com/${user})` : '');
function assertRequiredOptionPresence(options) {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error('Please create a GitHub personal access token at https://github.com/settings/tokens/new'
            + ' and add it as the GITHUB_TOKEN environment variable');
    }
    if (!(options === null || options === void 0 ? void 0 : options.owner) || !(options === null || options === void 0 ? void 0 : options.repo)) {
        throw new Error('Please provide a owner and repo to this changelog generator like this:\n'
            + '"changelog": ["@changesets/changelog-github", { "owner": "org", "repo": "repo" }]');
    }
}
const changelogFunctions = {
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
    getDependencyReleaseLine: async (changesets, dependenciesUpdated, dangerOptions) => {
        if (dependenciesUpdated.length === 0)
            return '';
        assertRequiredOptionPresence(dangerOptions);
        const options = dangerOptions;
        const commitLinks = changesets
            .filter(cs => cs.commit != null)
            .map(cs => commitLink(options.owner, options.repo, cs.commit));
        const dependencyReleaseLines = [
            `- Updated dependencies [${commitLinks.join(', ')}]`,
            ...(dependenciesUpdated.map(dependency => (`  - ${dependency.name}@${dependency.newVersion}`))),
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
    getReleaseLine: async (changeset, type, dangerOptions) => {
        assertRequiredOptionPresence(dangerOptions);
        const options = dangerOptions;
        const { meta: metaFromSummary, summary: replacedSummary } = (0, meta_1.replaceMeta)(changeset.summary);
        const metaFromPR = metaFromSummary.pull
            ? await (0, meta_1.getMetaFromPullRequest)(options.owner, options.repo, metaFromSummary.pull)
            : null;
        const commitID = metaFromSummary.commit || changeset.commit;
        const metaFromCommit = commitID
            ? await (0, meta_1.getMetaFromCommit)(options.owner, options.repo, commitID, { withRelatedPullRequest: true })
            : null;
        const ignoreUsersFilter = ((it) => it != null && (options.noThanksUsers && options.noThanksUsers.indexOf(it) === -1));
        const meta = {
            pull: metaFromSummary.pull || (metaFromCommit === null || metaFromCommit === void 0 ? void 0 : metaFromCommit.pull),
            commit: metaFromSummary.commit || (metaFromPR === null || metaFromPR === void 0 ? void 0 : metaFromPR.commit) || changeset.commit,
            users: [metaFromSummary.users || (metaFromPR === null || metaFromPR === void 0 ? void 0 : metaFromPR.user) || (metaFromCommit === null || metaFromCommit === void 0 ? void 0 : metaFromCommit.user)].flat().filter(ignoreUsersFilter),
        };
        const [firstLine, ...followingLines] = (options.categories
            ? await (0, category_1.prefixSummary)(replacedSummary, options.categories, options.owner, options.repo, meta.commit)
            : replacedSummary)
            .split('\n')
            .map(l => l.trimEnd());
        const newFirstLine = [
            firstLine,
            meta.pull ? `(${prLink(options.owner, options.repo, meta.pull)})` : null,
            (!meta.pull && meta.commit) ? `[${commitLink(options.owner, options.repo, meta.commit)}]` : null,
            meta.users.length > 0 ? `Thanks ${meta.users.map(it => userLink(it)).join(', ')}!` : null,
        ]
            .filter(it => it != null)
            .join(' ');
        const releaseLines = [
            '',
            '',
            `- ${newFirstLine}`,
            followingLines
                .map(l => `  ${l}`)
                .join('\n'),
        ]
            .join('\n');
        return releaseLines;
    },
};
exports.default = changelogFunctions;
//# sourceMappingURL=index.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetaFromCommit = exports.getLatestMergedPRAssociatedWithCommit = exports.getMetaFromPullRequest = exports.replaceMeta = void 0;
const rest_1 = require("@octokit/rest");
const regex_parser_1 = __importDefault(require("regex-parser"));
function replaceMeta(summary) {
    const meta = {
        pull: null,
        commit: null,
        users: null,
    };
    const processors = [
        /* Get Pull Request's info */
        {
            pattern: '/^\\s*(?:pr|pull|pull\\s+request):\\s*#?(\\d+)/im',
            process: (_, pr) => {
                const num = Number(pr);
                if (!Number.isNaN(num))
                    meta.pull = num;
                return '';
            },
        },
        /* Get Commit info */
        {
            pattern: '/^\\s*commit:\\s*([^\\s]+)/im',
            process: (_, commit) => {
                meta.commit = commit;
                return '';
            },
        },
        /* Get users info */
        {
            pattern: '/^\\s*(?:author|user):\\s*@?([^\\s]+)/gim',
            process: (_, user) => {
                meta.users = meta.users || [];
                meta.users.push(user);
                return '';
            },
        },
    ];
    let replacedSummary = summary;
    processors.forEach((p) => {
        replacedSummary = replacedSummary.replace((0, regex_parser_1.default)(p.pattern), p.process);
    });
    replacedSummary = replacedSummary.trim();
    return {
        meta,
        summary: replacedSummary,
    };
}
exports.replaceMeta = replaceMeta;
async function getMetaFromPullRequest(owner, repo, pull) {
    const octokit = new rest_1.Octokit({
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
exports.getMetaFromPullRequest = getMetaFromPullRequest;
async function getLatestMergedPRAssociatedWithCommit(owner, repo, commitID) {
    const octokit = new rest_1.Octokit({
        auth: process.env.GITHUB_TOKEN,
    });
    const prs = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
        owner,
        repo,
        commit_sha: commitID,
    });
    if (prs.data.length > 0) {
        return prs.data
            .filter(pr => pr.merged_at != null)
            .sort((prA, prB) => {
            const prAMergedAt = new Date(prA.merged_at);
            const prBMergedAt = new Date(prB.merged_at);
            return prAMergedAt.getTime() - prBMergedAt.getTime();
        })
            .at(0);
    }
    return undefined;
}
exports.getLatestMergedPRAssociatedWithCommit = getLatestMergedPRAssociatedWithCommit;
async function getMetaFromCommit(owner, repo, commitID, options = { withRelatedPullRequest: false }) {
    var _a, _b;
    const octokit = new rest_1.Octokit({
        auth: process.env.GITHUB_TOKEN,
    });
    let commitAuthorOrPRCreator = null;
    const commit = await octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: commitID,
    });
    commitAuthorOrPRCreator = ((_a = commit.data.author) === null || _a === void 0 ? void 0 : _a.login) || null;
    let latestMergedPRNumber = null;
    if (options.withRelatedPullRequest) {
        const pull = await getLatestMergedPRAssociatedWithCommit(owner, repo, commitID);
        latestMergedPRNumber = (pull === null || pull === void 0 ? void 0 : pull.number) || null;
        if ((_b = pull === null || pull === void 0 ? void 0 : pull.user) === null || _b === void 0 ? void 0 : _b.login) {
            commitAuthorOrPRCreator = pull.user.login;
        }
    }
    return {
        pull: latestMergedPRNumber,
        user: commitAuthorOrPRCreator,
    };
}
exports.getMetaFromCommit = getMetaFromCommit;
//# sourceMappingURL=meta.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefixSummary = void 0;
const regex_parser_1 = __importDefault(require("regex-parser"));
const meta_1 = require("./meta");
async function prefixSummary(summary, categories, owner, repo, commitID) {
    var _a;
    const summaryPatternMatcher = (pattern) => ((0, regex_parser_1.default)(pattern).exec(summary));
    const pr = await (0, meta_1.getLatestMergedPRAssociatedWithCommit)(owner, repo, commitID);
    const labels = (_a = pr === null || pr === void 0 ? void 0 : pr.labels) === null || _a === void 0 ? void 0 : _a.map(it => it.name);
    const labelMatcher = (target) => (labels === null || labels === void 0 ? void 0 : labels.includes(target));
    const prefixes = [];
    categories.forEach((c) => {
        if ((c.changesetSummaryPatterns && c.changesetSummaryPatterns.filter(summaryPatternMatcher).length > 0)
            || (c.pullRequestLabels && c.pullRequestLabels.filter(labelMatcher).length > 0)) {
            prefixes.push(c.text || '');
        }
    });
    const prefixedSummary = (prefixes.length > 0 ? `[${prefixes.join(', ')}] ` : '') + summary;
    return prefixedSummary;
}
exports.prefixSummary = prefixSummary;
//# sourceMappingURL=category.js.map
export declare type Category = {
    text?: string;
    changesetSummaryPatterns?: Array<string>;
    pullRequestLabels?: Array<string>;
};
export declare function prefixSummary(summary: string, categories: Array<Category>, owner: string, repo: string, commitID: string): Promise<string>;

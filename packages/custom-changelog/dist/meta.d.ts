import { RestEndpointMethodTypes } from '@octokit/rest';
export declare type Meta = {
    pull: number | null;
    commit: string | null;
    users: Array<string> | null;
};
export declare function replaceMeta(summary: string): {
    meta: Meta;
    summary: string;
};
export declare function getMetaFromPullRequest(owner: string, repo: string, pull: number): Promise<{
    user: string | null;
    commit: string | null;
}>;
declare type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
declare type pullType = ArrayElement<RestEndpointMethodTypes['repos']['listPullRequestsAssociatedWithCommit']['response']['data']>;
export declare function getLatestMergedPRAssociatedWithCommit(owner: string, repo: string, commitID: string): Promise<pullType | undefined>;
export declare function getMetaFromCommit(owner: string, repo: string, commitID: string, options?: {
    withRelatedPullRequest: boolean;
}): Promise<{
    pull: number | null;
    user: string | null;
}>;
export {};

export enum AccessPermission {
    READ_AND_EDIT = 'Read & Edit',
    READ_ONLY = 'Read Only',
    NONE = 'None'
}

export interface PostsModel {
    id: number;
    author: string;
    title: string;
    content: string;
    excerpt: string;
    timestamp: string;
    author_access: AccessPermission;
    team_access: AccessPermission;
    authenticated_access: AccessPermission;
    public_access: string;
}

export interface PostsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PostsModel[];
}
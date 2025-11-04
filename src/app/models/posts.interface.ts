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

    likes_count: number;    
    comments_count: number;

    likers: string[];
    commenters: string[];

    showLikers?: boolean;
    showCommenters?: boolean;

    author_access: AccessPermission;
    team_access: AccessPermission;
    authenticated_access: AccessPermission;
    public_access: AccessPermission;
}

export interface PostsResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: PostsModel[];
}
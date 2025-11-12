export enum AccessPermission {
    READ_AND_EDIT = 'Read & Edit',
    READ_ONLY = 'Read Only',
    NONE = 'None'
}

export interface PostsModel {
    id: number;
    author: string;
    author_team: string;
    title: string;
    content: string;
    excerpt: string;
    timestamp: string;

    author_access: 'Read & Edit';
    team_access: AccessPermission;
    authenticated_access: AccessPermission;
    public_access: 'Read Only' | 'None';
}

export interface PostRequestBody {
    title: string;
    content: string;
    author_access: 'Read & Edit';
    team_access: AccessPermission;
    authenticated_access: AccessPermission;
    public_access: 'Read Only' | 'None';
}

export interface LikesModel {
    id: number;
    user_id: number;
    post: number;
    username: string; 
}

export interface LikeToggleResponse {
    liked: boolean;
    detail: string;
}

export interface CommentsModel {
    id: number;
    user_id: number;
    post: number;
    username: string;
    content: string;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export type PostsResponse = PaginatedResponse<PostsModel>;
export type LikesResponse = PaginatedResponse<LikesModel>;
export type CommentsResponse = PaginatedResponse<CommentsModel>;
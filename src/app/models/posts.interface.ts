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
    
    showLikers?: boolean;
    showCommenters?: boolean;

    author_access: 'Read & Edit';
    team_access: AccessPermission;
    authenticated_access: AccessPermission;
    public_access: 'Read Only' | 'None';
}

export interface LikeItem {
    id: number;
    user_id: number;
    post: number;
    username: string; 
}

export interface CommentItem {
    id: number;
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
export type LikesResponse = PaginatedResponse<LikeItem>;
export type CommentsResponse = PaginatedResponse<CommentItem>;
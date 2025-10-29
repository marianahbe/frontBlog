export interface PostsModel {
    id: number;
    author: string;
    title: string;
    content: string;
    excerpt: string;
    timestamp: string;
    author_access: string;
    team_access: string;
    authenticated_access: string;
    public_access: string;
}

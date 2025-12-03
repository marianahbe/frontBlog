export interface UserLogin{
    email: string;
    password: string;
}

export interface UserData {
    id: number;
    username: string;
    email: string;
    role: 'ADMIN' | 'BLOGGER';
    team_id: number;
    team_name: string;
}

export interface AuthResponse {
    token: string;
    user_data: UserData; 
}
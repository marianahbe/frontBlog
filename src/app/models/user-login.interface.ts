export interface UserLogin{
    email: string;
    password: string;
    passwordConf: string;
}

export interface AuthResponse{
    token: string;
    username: string;
    email: string;
}
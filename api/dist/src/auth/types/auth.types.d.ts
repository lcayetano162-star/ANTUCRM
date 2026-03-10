export declare enum UserRole {
    USER = "USER",
    MANAGER = "MANAGER",
    ADMIN = "ADMIN"
}
export interface JwtPayload {
    sub: string;
    email: string;
    tenantId: string;
    role: UserRole;
    permissions: string[];
    tokenVersion?: number;
    iat: number;
    exp: number;
}
export interface CurrentUser {
    id: string;
    email: string;
    tenantId: string;
    role: UserRole;
    permissions: string[];
}

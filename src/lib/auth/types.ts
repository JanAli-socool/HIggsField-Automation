export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export interface UserData {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isVerified: boolean;
}
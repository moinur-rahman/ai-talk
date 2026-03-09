import type { Request as ExpressRequest } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: UserPayload;
}

import type { AppRole } from '@shared/permissions';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: AppRole;
      };
    }
  }
}

export {};

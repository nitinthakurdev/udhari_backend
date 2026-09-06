import type { ICurrentUser } from "@/types/userTypes";

declare global {
  namespace Express {
    interface Request {
      currentUser?: ICurrentUser;
    }
  }
}

export {};

import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "hal-response";
import errorMessages from "../../errorMessages.json";

export const requireAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  if (req.currentUser.user_role?.slug !== "admin") {
    throw new ForbiddenError(errorMessages.AUTHORIZATION.ACCESS_DENIED);
  }

  next();
};

export const requireBusinessOrAdmin = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  if (!["business", "admin"].includes(req.currentUser.user_role?.slug ?? "")) {
    throw new ForbiddenError(errorMessages.AUTHORIZATION.ACCESS_DENIED);
  }

  next();
};

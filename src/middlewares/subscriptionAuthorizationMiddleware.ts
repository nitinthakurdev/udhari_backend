import {
  findActiveUserSubscription,
  renewFreeSubscriptionIfEligible,
} from "@/services/userSubscriptionService";
import type { NextFunction, Request, Response } from "express";
import { AsyncHandler, ForbiddenError, UnauthorizedError } from "hal-response";
import errorMessages from "../../errorMessages.json";

export const requireActiveSubscription = AsyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.currentUser) {
      throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
    }
    if (req.currentUser.user_role?.slug === "admin") {
      next();
      return;
    }

    await renewFreeSubscriptionIfEligible(req.currentUser.id);
    const subscription = await findActiveUserSubscription(req.currentUser.id);
    if (!subscription) {
      throw new ForbiddenError(errorMessages.USER_SUBSCRIPTION.ACTIVE_REQUIRED);
    }

    next();
  },
);

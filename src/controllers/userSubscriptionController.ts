import {
  createUserSubscription as createUserSubscriptionService,
  deleteUserSubscriptionByUuid,
  findActiveUserSubscription,
  findSubscriptionIdByUuid,
  findUserIdByUuid,
  findUserSubscriptionByUuid,
  findUserSubscriptions,
  updateUserSubscriptionByUuid,
  activateFreeSubscription,
  FreeSubscriptionError,
  renewFreeSubscriptionIfEligible,
} from "@/services/userSubscriptionService";
import type {
  IUserSubscriptionCreatePayload,
  IUserSubscriptionUpdatePayload,
} from "@/types/userSubscriptionTypes";
import {
  AsyncHandler,
  ConflictError,
  BadRequestError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

export const listUserSubscriptions = AsyncHandler(async (_req, res): Promise<void> => {
  const assignments = await findUserSubscriptions();
  res
    .status(StatusCodes.OK)
    .json(response.ok(assignments, { message: successMessages.USER_SUBSCRIPTION.LIST }));
});

export const getCurrentUserSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  await renewFreeSubscriptionIfEligible(req.currentUser.id);
  const assignment = await findActiveUserSubscription(req.currentUser.id);
  res.status(StatusCodes.OK).json(
    response.ok(assignment ?? null, {
      message: assignment
        ? successMessages.USER_SUBSCRIPTION.GET
        : successMessages.USER_SUBSCRIPTION.NONE_ACTIVE,
    }),
  );
});

export const activateFreeUserSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  let assignment;
  try {
    assignment = await activateFreeSubscription(
      req.currentUser.id,
      (req.body as { subscription_uuid: string }).subscription_uuid,
    );
  } catch (error) {
    if (error instanceof FreeSubscriptionError) throw new BadRequestError(error.message);
    throw error;
  }
  if (!assignment) {
    throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.SUBSCRIPTION_NOT_FOUND);
  }
  res
    .status(StatusCodes.CREATED)
    .json(
      response.created(assignment, { message: successMessages.USER_SUBSCRIPTION.FREE_ACTIVATED }),
    );
});

export const getUserSubscription = AsyncHandler(async (req, res): Promise<void> => {
  const assignment = await findUserSubscriptionByUuid(req.params["uuid"] as string);
  if (!assignment) throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.NOT_FOUND);
  res
    .status(StatusCodes.OK)
    .json(response.ok(assignment, { message: successMessages.USER_SUBSCRIPTION.GET }));
});

export const createUserSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const data = req.body as IUserSubscriptionCreatePayload;
  const userId = await findUserIdByUuid(data.user_uuid);
  if (!userId) throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.USER_NOT_FOUND);
  const subscriptionId = await findSubscriptionIdByUuid(data.subscription_uuid);
  if (!subscriptionId) {
    throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.SUBSCRIPTION_NOT_FOUND);
  }
  if (await findActiveUserSubscription(userId)) {
    throw new ConflictError(errorMessages.USER_SUBSCRIPTION.ALREADY_EXISTS);
  }
  const assignment = await createUserSubscriptionService({
    user_id: userId,
    subscription_id: subscriptionId,
    expiry_at: data.expiry_at,
    created_by: req.currentUser.id,
  });
  res
    .status(StatusCodes.CREATED)
    .json(response.created(assignment, { message: successMessages.USER_SUBSCRIPTION.CREATE }));
});

export const updateUserSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const uuid = req.params["uuid"] as string;
  const data = req.body as IUserSubscriptionUpdatePayload;
  if (!(await findUserSubscriptionByUuid(uuid))) {
    throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.NOT_FOUND);
  }
  const subscriptionId = data.subscription_uuid
    ? await findSubscriptionIdByUuid(data.subscription_uuid)
    : undefined;
  if (data.subscription_uuid && !subscriptionId) {
    throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.SUBSCRIPTION_NOT_FOUND);
  }
  const assignment = await updateUserSubscriptionByUuid(uuid, {
    ...(subscriptionId ? { subscription_id: subscriptionId } : {}),
    ...(data.expiry_at ? { expiry_at: data.expiry_at } : {}),
    updated_by: req.currentUser.id,
  });
  if (!assignment) throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.NOT_FOUND);
  res
    .status(StatusCodes.OK)
    .json(response.ok(assignment, { message: successMessages.USER_SUBSCRIPTION.UPDATE }));
});

export const deleteUserSubscription = AsyncHandler(async (req, res): Promise<void> => {
  const assignment = await deleteUserSubscriptionByUuid(req.params["uuid"] as string);
  if (!assignment) throw new NotFoundError(errorMessages.USER_SUBSCRIPTION.NOT_FOUND);
  res
    .status(StatusCodes.OK)
    .json(response.ok(assignment, { message: successMessages.USER_SUBSCRIPTION.DELETE }));
});

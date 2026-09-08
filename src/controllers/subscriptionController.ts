import {
  createSubscription as createSubscriptionService,
  deleteSubscriptionByUuid,
  findSubscriptionByNameAndRole,
  findSubscriptionByUuid,
  findSubscriptions,
  updateSubscriptionByUuid,
} from "@/services/subscriptionServices";
import { findRoleById } from "@/services/roleServices";
import type {
  ISubscriptionCreatePayload,
  ISubscriptionUpdateData,
  ISubscriptionUpdatePayload,
} from "@/types/subscriptionTypes";
import {
  AsyncHandler,
  ConflictError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

export const listSubscriptions = AsyncHandler(async (_req, res): Promise<void> => {
  const subscriptions = await findSubscriptions();

  res.status(StatusCodes.OK).json(
    response.ok(subscriptions, {
      message: successMessages.SUBSCRIPTION.LIST,
    }),
  );
});

export const getSubscription = AsyncHandler(async (req, res): Promise<void> => {
  const subscription = await findSubscriptionByUuid(req.params["uuid"] as string);

  if (!subscription) {
    throw new NotFoundError(errorMessages.SUBSCRIPTION.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(
    response.ok(subscription, {
      message: successMessages.SUBSCRIPTION.GET,
    }),
  );
});

export const createSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as ISubscriptionCreatePayload;
  const role = await findRoleById(data.role_id);

  if (!role) {
    throw new NotFoundError(errorMessages.SUBSCRIPTION.ROLE_NOT_FOUND);
  }

  const existingSubscription = await findSubscriptionByNameAndRole(data.name, data.role_id);

  if (existingSubscription) {
    throw new ConflictError(errorMessages.SUBSCRIPTION.ALREADY_EXISTS);
  }

  const subscription = await createSubscriptionService({
    ...data,
    created_by: req.currentUser.id,
  });

  res.status(StatusCodes.CREATED).json(
    response.created(subscription, {
      message: successMessages.SUBSCRIPTION.CREATE,
    }),
  );
});

export const updateSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const uuid = req.params["uuid"] as string;
  const data = req.body as ISubscriptionUpdatePayload;
  const currentSubscription = await findSubscriptionByUuid(uuid);

  if (!currentSubscription) {
    throw new NotFoundError(errorMessages.SUBSCRIPTION.NOT_FOUND);
  }

  const roleId = data.role_id ?? currentSubscription.role_id;

  if (data.role_id !== undefined) {
    const role = await findRoleById(data.role_id);

    if (!role) {
      throw new NotFoundError(errorMessages.SUBSCRIPTION.ROLE_NOT_FOUND);
    }
  }

  const existingSubscription = await findSubscriptionByNameAndRole(
    data.name ?? currentSubscription.name,
    roleId,
    uuid,
  );

  if (existingSubscription) {
    throw new ConflictError(errorMessages.SUBSCRIPTION.ALREADY_EXISTS);
  }

  const updateData: ISubscriptionUpdateData = {
    ...data,
    updated_by: req.currentUser.id,
  };
  const subscription = await updateSubscriptionByUuid(uuid, updateData);

  if (!subscription) {
    throw new NotFoundError(errorMessages.SUBSCRIPTION.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(
    response.ok(subscription, {
      message: successMessages.SUBSCRIPTION.UPDATE,
    }),
  );
});

export const deleteSubscription = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const subscription = await deleteSubscriptionByUuid(
    req.params["uuid"] as string,
    req.currentUser.id,
  );

  if (!subscription) {
    throw new NotFoundError(errorMessages.SUBSCRIPTION.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(
    response.ok(subscription, {
      message: successMessages.SUBSCRIPTION.DELETE,
    }),
  );
});

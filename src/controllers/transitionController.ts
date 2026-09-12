import {
  checkTransitionAccess,
  createTransition as createTransitionService,
  deleteTransitionByUuid,
  findTransitionByUuid,
  findTransitions,
  findTransitionsForBusiness,
  isUnitAvailableForBusiness,
  updateTransitionByUuid,
} from "@/services/transitionService";
import type { ITransitionCreatePayload, ITransitionUpdatePayload } from "@/types/transitionTypes";
import {
  AsyncHandler,
  ForbiddenError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

export const listTransitions = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const transitions = await findTransitions(req.currentUser.id);
  res
    .status(StatusCodes.OK)
    .json(response.ok(transitions, { message: successMessages.TRANSITION.LIST }));
});

export const listBusinessTransitions = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const transitions = await findTransitionsForBusiness(
    req.params["uuid"] as string,
    req.currentUser.id,
  );

  if (!transitions) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(transitions, { message: successMessages.TRANSITION.LIST }));
});

export const getTransition = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const transition = await findTransitionByUuid(req.params["uuid"] as string, req.currentUser.id);

  if (!transition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(transition, { message: successMessages.TRANSITION.GET }));
});

export const createTransition = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as ITransitionCreatePayload;
  const access = await checkTransitionAccess(data.user_id, data.business_id, req.currentUser.id);

  if (!access.userExists) {
    throw new NotFoundError(errorMessages.TRANSITION.USER_NOT_FOUND);
  }
  if (!access.businessExists) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }
  if (!access.connectionExists) {
    throw new NotFoundError(errorMessages.TRANSITION.CONNECTION_NOT_FOUND);
  }
  if (!access.canAccess) {
    throw new ForbiddenError(errorMessages.TRANSITION.ACCESS_DENIED);
  }

  if (!(await isUnitAvailableForBusiness(data.unit_id, data.business_id))) {
    throw new NotFoundError(errorMessages.TRANSITION.UNIT_NOT_FOUND);
  }

  const transition = await createTransitionService({
    ...data,
    created_by: req.currentUser.id,
  });

  res.status(StatusCodes.CREATED).json(
    response.created(transition, {
      message: successMessages.TRANSITION.CREATE,
    }),
  );
});

export const updateTransition = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const uuid = req.params["uuid"] as string;
  const data = req.body as ITransitionUpdatePayload;
  const currentTransition = await findTransitionByUuid(uuid, req.currentUser.id);

  if (!currentTransition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  const access = await checkTransitionAccess(
    currentTransition.user_id,
    currentTransition.business_id,
    req.currentUser.id,
  );

  if (data.approved_by_user !== undefined && !access.isUser) {
    throw new ForbiddenError(errorMessages.TRANSITION.USER_APPROVAL_DENIED);
  }
  if (data.approved_by_business !== undefined && !access.isBusinessOwner) {
    throw new ForbiddenError(errorMessages.TRANSITION.BUSINESS_APPROVAL_DENIED);
  }

  if (
    data.unit_id !== undefined &&
    !(await isUnitAvailableForBusiness(data.unit_id, currentTransition.business_id))
  ) {
    throw new NotFoundError(errorMessages.TRANSITION.UNIT_NOT_FOUND);
  }

  const transition = await updateTransitionByUuid(uuid, req.currentUser.id, {
    ...data,
    updated_by: req.currentUser.id,
  });

  if (!transition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(transition, { message: successMessages.TRANSITION.UPDATE }));
});

export const deleteTransition = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const deleted = await deleteTransitionByUuid(req.params["uuid"] as string, req.currentUser.id);

  if (!deleted) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(null, { message: successMessages.TRANSITION.DELETE }));
});

import {
  checkBusinessTransitionAccess,
  checkTransitionAccess,
  createTransition as createTransitionService,
  createTransitions as createTransitionsService,
  findTransitionByUuid,
  findTransitions,
  findTransitionsForBusiness,
  getTransitionBalanceSummary,
  getTransitionBalanceSummaryForBusiness,
  isUnitAvailableForBusiness,
  updateTransitionByUuid,
} from "@/services/transitionService";
import type {
  ITransitionBatchCreatePayload,
  ITransitionCreatePayload,
  ITransitionListOptions,
  ITransitionUpdatePayload,
} from "@/types/transitionTypes";
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

const getListOptions = (query: Record<string, unknown>): ITransitionListOptions => ({
  page: Number(query["page"] ?? 1),
  limit: Number(query["limit"] ?? 20),
  paginated: query["page"] !== undefined || query["limit"] !== undefined,
  view: (query["view"] as ITransitionListOptions["view"] | undefined) ?? "all",
  ...(query["party_type"] ? { partyType: query["party_type"] as "user" | "business" } : {}),
  ...(query["party_id"] ? { partyId: Number(query["party_id"]) } : {}),
});

const getPaginationMeta = (page: number, limit: number, total: number) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next_page: page < totalPages,
    has_previous_page: page > 1,
  };
};

export const listTransitions = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const options = getListOptions(req.query);
  const transitions = await findTransitions(req.currentUser.id, options);
  res.status(StatusCodes.OK).json(
    response.ok(transitions.items, {
      message: successMessages.TRANSITION.LIST,
      meta: { pagination: getPaginationMeta(options.page, options.limit, transitions.total) },
    }),
  );
});

export const listBusinessTransitions = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const options = getListOptions(req.query);
  const transitions = await findTransitionsForBusiness(
    req.params["uuid"] as string,
    req.currentUser.id,
    options,
  );

  if (!transitions) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(
    response.ok(transitions.items, {
      message: successMessages.TRANSITION.LIST,
      meta: { pagination: getPaginationMeta(options.page, options.limit, transitions.total) },
    }),
  );
});

export const transitionSummary = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const summary = await getTransitionBalanceSummary(req.currentUser.id);
  res.status(StatusCodes.OK).json(response.ok(summary));
});

export const businessTransitionSummary = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const summary = await getTransitionBalanceSummaryForBusiness(
    req.params["uuid"] as string,
    req.currentUser.id,
  );
  if (!summary) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }
  res.status(StatusCodes.OK).json(response.ok(summary));
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
  const roleSlug = req.currentUser.user_role?.slug;
  const sourceBusinessUuid = roleSlug === "business" ? data.customer_business_uuid : undefined;
  const isBusinessToBusiness = Boolean(sourceBusinessUuid);
  const customerUserId = isBusinessToBusiness
    ? req.currentUser.id
    : roleSlug === "user"
      ? req.currentUser.id
      : data.customer_user_id;

  if (!customerUserId) {
    throw new NotFoundError(errorMessages.TRANSITION.USER_NOT_FOUND);
  }

  const businessAccess = sourceBusinessUuid
    ? await checkBusinessTransitionAccess(sourceBusinessUuid, data.business_id, req.currentUser.id)
    : null;
  const access = !isBusinessToBusiness
    ? await checkTransitionAccess(customerUserId, data.business_id, req.currentUser.id)
    : null;

  if (access && !access.customerExists) {
    throw new NotFoundError(errorMessages.TRANSITION.USER_NOT_FOUND);
  }
  if (
    (access && !access.businessExists) ||
    (businessAccess && !businessAccess.targetBusinessExists)
  ) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }
  if (!(access?.connectionExists ?? businessAccess?.connectionExists)) {
    throw new NotFoundError(errorMessages.TRANSITION.CONNECTION_NOT_FOUND);
  }
  if (access && !access.canAccess) {
    throw new ForbiddenError(errorMessages.TRANSITION.ACCESS_DENIED);
  }
  const businessUserId = access?.businessUserId ?? businessAccess?.targetOwnerId;
  if (!businessUserId) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }

  const unitBusinessId = businessAccess?.sourceBusinessId ?? data.business_id;
  if (!unitBusinessId || !(await isUnitAvailableForBusiness(data.unit_id, unitBusinessId))) {
    throw new NotFoundError(errorMessages.TRANSITION.UNIT_NOT_FOUND);
  }

  const transition = await createTransitionService({
    business_id: data.business_id,
    unit_id: data.unit_id,
    product_name: data.product_name,
    product_unit_price: data.product_unit_price,
    total_price: data.total_price,
    ...(data.product_qty !== undefined ? { product_qty: data.product_qty } : {}),
    ...(data.comment !== undefined ? { comment: data.comment } : {}),
    customer_user_id: customerUserId,
    customer_business_id: businessAccess?.sourceBusinessId ?? null,
    business_user_id: businessUserId,
    request_status: "pending",
    payment_status: "unpaid",
    balance_type: isBusinessToBusiness ? (data.balance_type ?? "payable") : "payable",
    created_by: req.currentUser.id,
  });

  res.status(StatusCodes.CREATED).json(
    response.created(transition, {
      message: successMessages.TRANSITION.CREATE,
    }),
  );
});

export const createTransitions = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const currentUserId = req.currentUser.id;
  const data = req.body as ITransitionBatchCreatePayload;
  const roleSlug = req.currentUser.user_role?.slug;
  const sourceBusinessUuid = roleSlug === "business" ? data.customer_business_uuid : undefined;
  const isBusinessToBusiness = Boolean(sourceBusinessUuid);
  const customerUserId = isBusinessToBusiness
    ? currentUserId
    : roleSlug === "user"
      ? currentUserId
      : data.customer_user_id;

  if (!customerUserId) {
    throw new NotFoundError(errorMessages.TRANSITION.USER_NOT_FOUND);
  }

  const businessAccess = sourceBusinessUuid
    ? await checkBusinessTransitionAccess(sourceBusinessUuid, data.business_id, currentUserId)
    : null;
  const access = !isBusinessToBusiness
    ? await checkTransitionAccess(customerUserId, data.business_id, currentUserId)
    : null;

  if (access && !access.customerExists) {
    throw new NotFoundError(errorMessages.TRANSITION.USER_NOT_FOUND);
  }
  if (
    (access && !access.businessExists) ||
    (businessAccess && !businessAccess.targetBusinessExists)
  ) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }
  if (!(access?.connectionExists ?? businessAccess?.connectionExists)) {
    throw new NotFoundError(errorMessages.TRANSITION.CONNECTION_NOT_FOUND);
  }
  if (access && !access.canAccess) {
    throw new ForbiddenError(errorMessages.TRANSITION.ACCESS_DENIED);
  }

  const businessUserId = access?.businessUserId ?? businessAccess?.targetOwnerId;
  if (!businessUserId) {
    throw new NotFoundError(errorMessages.TRANSITION.BUSINESS_NOT_FOUND);
  }

  const unitBusinessId = businessAccess?.sourceBusinessId ?? data.business_id;
  const unitIds = [...new Set(data.items.map((item) => item.unit_id))];
  const unitChecks = await Promise.all(
    unitIds.map((unitId) => isUnitAvailableForBusiness(unitId, unitBusinessId)),
  );
  if (unitChecks.some((available) => !available)) {
    throw new NotFoundError(errorMessages.TRANSITION.UNIT_NOT_FOUND);
  }

  const transitions = await createTransitionsService(
    data.items.map((item) => ({
      ...item,
      customer_user_id: customerUserId,
      customer_business_id: businessAccess?.sourceBusinessId ?? null,
      business_id: data.business_id,
      business_user_id: businessUserId,
      request_status: "pending",
      payment_status: "unpaid",
      balance_type: isBusinessToBusiness ? (data.balance_type ?? "payable") : "payable",
      created_by: currentUserId,
    })),
  );

  res.status(StatusCodes.CREATED).json(
    response.created(transitions, {
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

  if (currentTransition.request_status !== "pending") {
    throw new ForbiddenError(errorMessages.TRANSITION.LOCKED);
  }

  const isApproval = data.request_status === "approved";
  if (isApproval && currentTransition.created_by === req.currentUser.id) {
    throw new ForbiddenError(errorMessages.TRANSITION.APPROVAL_DENIED);
  }
  if (!isApproval && currentTransition.created_by !== req.currentUser.id) {
    throw new ForbiddenError(errorMessages.TRANSITION.EDIT_DENIED);
  }
  if (data.balance_type !== undefined && currentTransition.customer_business_id === null) {
    throw new ForbiddenError(errorMessages.TRANSITION.BALANCE_TYPE_DENIED);
  }

  if (
    data.unit_id !== undefined &&
    !(await isUnitAvailableForBusiness(
      data.unit_id,
      currentTransition.customer_business_id ?? currentTransition.business_id,
    ))
  ) {
    throw new NotFoundError(errorMessages.TRANSITION.UNIT_NOT_FOUND);
  }

  const transition = await updateTransitionByUuid(uuid, req.currentUser.id, {
    ...data,
    request_status: isApproval ? "approved" : "pending",
    updated_by: req.currentUser.id,
  });

  if (!transition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(transition, { message: successMessages.TRANSITION.UPDATE }));
});

export const cancelTransition = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const uuid = req.params["uuid"] as string;
  const currentTransition = await findTransitionByUuid(uuid, req.currentUser.id);

  if (!currentTransition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }
  if (currentTransition.request_status !== "pending") {
    throw new ForbiddenError(errorMessages.TRANSITION.LOCKED);
  }
  if (currentTransition.created_by !== req.currentUser.id) {
    throw new ForbiddenError(errorMessages.TRANSITION.CANCEL_DENIED);
  }

  const transition = await updateTransitionByUuid(uuid, req.currentUser.id, {
    request_status: "cancelled",
    updated_by: req.currentUser.id,
  });

  if (!transition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(transition, { message: successMessages.TRANSITION.CANCEL }));
});

export const receiveTransitionPayment = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const uuid = req.params["uuid"] as string;
  const currentTransition = await findTransitionByUuid(uuid, req.currentUser.id);

  if (!currentTransition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }
  if (currentTransition.account_type !== "receivable") {
    throw new ForbiddenError(errorMessages.TRANSITION.PAYMENT_RECEIPT_DENIED);
  }
  if (currentTransition.request_status !== "approved") {
    throw new ForbiddenError(errorMessages.TRANSITION.PAYMENT_REQUIRES_APPROVAL);
  }

  const transition =
    currentTransition.payment_status === "paid"
      ? currentTransition
      : await updateTransitionByUuid(uuid, req.currentUser.id, {
          payment_status: "paid",
          updated_by: req.currentUser.id,
        });

  if (!transition) {
    throw new NotFoundError(errorMessages.TRANSITION.NOT_FOUND);
  }

  res.status(StatusCodes.OK).json(
    response.ok(transition, {
      message: successMessages.TRANSITION.PAYMENT_RECEIVED,
    }),
  );
});

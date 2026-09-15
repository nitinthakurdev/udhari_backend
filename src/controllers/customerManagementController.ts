import {
  checkTheCustomerAlreadyAdded,
  createCustomerManagement as createCustomerManagementService,
  customerConnectionReferencesExist,
  deleteCustomerConnectionByBusinessOwner,
  deleteCustomerManagementByUuid,
  findCustomerManagementByUuid,
  findOwnedBusinessId,
  getBusinessConnectionsForBusiness,
  getConnectionRequests,
  getCustomerConnectionReferences,
  getConnectedUsers,
  getUsersConnectedToBusiness,
  searchCustomersForBusiness,
  respondToConnectionRequest,
  updateCustomerManagementByUuid,
} from "@/services/customerManagementService";
import type {
  IConnectCustomerPayload,
  IConnectionRequestResponsePayload,
  ICustomerManagementPayload,
  ICustomerManagementUpdatePayload,
} from "@/types/customerManagementTypes";
import {
  AsyncHandler,
  BadRequestError,
  ConflictError,
  HalSuccess,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import { notifyUsers } from "@/socket";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

export const listCustomerManagement = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const customers = await getConnectedUsers(req.currentUser.id);
  res
    .status(StatusCodes.OK)
    .json(response.ok(customers, { message: successMessages.CUSTOMER_MANAGEMENT.LIST }));
});

export const listUsersConnectedToBusiness = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const customers = await getUsersConnectedToBusiness(
    req.currentUser.id,
    req.params["uuid"] as string,
  );

  if (!customers) {
    throw new NotFoundError(errorMessages.BUSINESS.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(customers, { message: successMessages.CUSTOMER_MANAGEMENT.LIST }));
});

export const listBusinessConnectionsForBusiness = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const connections = await getBusinessConnectionsForBusiness(
    req.currentUser.id,
    req.params["uuid"] as string,
  );
  if (!connections) {
    throw new NotFoundError(errorMessages.BUSINESS.NOT_FOUND);
  }
  res
    .status(StatusCodes.OK)
    .json(response.ok(connections, { message: successMessages.CUSTOMER_MANAGEMENT.LIST }));
});

export const searchCustomers = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const searchKey = typeof req.query["key"] === "string" ? req.query["key"].trim() : "";
  if (!searchKey) {
    throw new BadRequestError("Search key is required.");
  }

  const customers = await searchCustomersForBusiness(
    searchKey,
    req.currentUser.id,
    req.params["uuid"] as string,
  );

  if (!customers) {
    throw new NotFoundError(errorMessages.BUSINESS.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(customers, { message: successMessages.CUSTOMER_MANAGEMENT.LIST }));
});

export const connectCustomer = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as IConnectCustomerPayload;
  const references = await getCustomerConnectionReferences(
    data.user_id,
    data.business_uuid,
    req.currentUser.id,
  );

  if (!references.user) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.USER_NOT_FOUND);
  }
  if (!references.business) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.BUSINESS_NOT_FOUND);
  }

  const existingCustomer = await checkTheCustomerAlreadyAdded(
    references.user.id,
    references.business.id,
    req.currentUser.id,
  );
  if (existingCustomer) {
    if (existingCustomer.request_status !== "rejected") {
      throw new ConflictError(errorMessages.CUSTOMER_MANAGEMENT.ALREADY_EXISTS);
    }
    await existingCustomer.destroy();
  }

  const customer = await createCustomerManagementService({
    connect_user_id: references.user.id,
    business_id: references.business.id,
    role: "business",
    created_by: req.currentUser.id,
    source_business_id: null,
  });

  notifyUsers([references.user.id], {
    type: "connection.requested",
    title: "New business request",
    message: `${req.currentUser.first_name} wants to connect with you.`,
    ...(customer ? { data: { connection_uuid: customer.uuid } } : {}),
  });

  res.status(StatusCodes.CREATED).json(
    response.created(customer, {
      message: successMessages.CUSTOMER_MANAGEMENT.REQUEST_SENT,
    }),
  );
});

export const listConnectionRequests = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const requests = await getConnectionRequests(req.currentUser.id);
  res
    .status(StatusCodes.OK)
    .json(response.ok(requests, { message: successMessages.CUSTOMER_MANAGEMENT.LIST }));
});

export const respondToRequest = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as IConnectionRequestResponsePayload;
  const request = await respondToConnectionRequest(
    req.params["uuid"] as string,
    req.currentUser.id,
    data.request_status,
  );

  if (!request) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.REQUEST_NOT_FOUND);
  }

  notifyUsers(
    [request.created_by, request.connect_user_id].filter(
      (userId) => userId !== req.currentUser?.id,
    ),
    {
      type: "connection.responded",
      title: data.request_status === "approved" ? "Request accepted" : "Request declined",
      message: `${req.currentUser.first_name} ${data.request_status === "approved" ? "accepted" : "declined"} your connection request.`,
      data: { connection_uuid: request.uuid, request_status: data.request_status },
    },
  );

  res.status(StatusCodes.OK).json(
    response.ok(request, {
      message: successMessages.CUSTOMER_MANAGEMENT.REQUEST_UPDATED,
    }),
  );
});

export const disconnectCustomer = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const deleted = await deleteCustomerConnectionByBusinessOwner(
    req.params["uuid"] as string,
    req.currentUser.id,
  );

  if (!deleted) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(null, { message: successMessages.CUSTOMER_MANAGEMENT.DELETE }));
});

export const createCustomerManagement = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as ICustomerManagementPayload;
  const roleSlug = req.currentUser.user_role?.slug;
  const sourceBusinessId =
    roleSlug === "business" && data.source_business_uuid
      ? await findOwnedBusinessId(data.source_business_uuid, req.currentUser.id)
      : null;
  if (roleSlug === "business" && !sourceBusinessId) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.BUSINESS_NOT_FOUND);
  }
  const references = await customerConnectionReferencesExist(
    data.connect_user_id,
    data.business_id,
  );

  if (!references.userExists) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.USER_NOT_FOUND);
  }
  if (!references.businessExists) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.BUSINESS_NOT_FOUND);
  }

  const existingCustomer = await checkTheCustomerAlreadyAdded(
    data.connect_user_id,
    data.business_id,
    req.currentUser.id,
  );
  if (existingCustomer) {
    if (existingCustomer.request_status !== "rejected") {
      throw new ConflictError(errorMessages.CUSTOMER_MANAGEMENT.ALREADY_EXISTS);
    }
    await existingCustomer.destroy();
  }

  const customer = await createCustomerManagementService({
    connect_user_id: data.connect_user_id,
    business_id: data.business_id,
    role: "customer",
    created_by: req.currentUser.id,
    source_business_id: sourceBusinessId,
  });

  notifyUsers([data.connect_user_id], {
    type: "connection.requested",
    title: "New business request",
    message: `${req.currentUser.first_name} wants to connect with your business.`,
    ...(customer ? { data: { connection_uuid: customer.uuid } } : {}),
  });

  res.status(StatusCodes.CREATED).json(
    response.created(customer, {
      message: successMessages.CUSTOMER_MANAGEMENT.REQUEST_SENT,
    }),
  );
});

export const updateCustomerManagement = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const uuid = req.params["uuid"] as string;
  const data = req.body as ICustomerManagementUpdatePayload;
  const currentCustomer = await findCustomerManagementByUuid(uuid, req.currentUser.id);

  if (!currentCustomer) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.NOT_FOUND);
  }

  const connectUserId = data.connect_user_id ?? currentCustomer.connect_user_id;
  const businessId = data.business_id ?? currentCustomer.business_id;
  const references = await customerConnectionReferencesExist(connectUserId, businessId);

  if (!references.userExists) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.USER_NOT_FOUND);
  }
  if (!references.businessExists) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.BUSINESS_NOT_FOUND);
  }

  const existingCustomer = await checkTheCustomerAlreadyAdded(
    connectUserId,
    businessId,
    req.currentUser.id,
    uuid,
  );
  if (existingCustomer) {
    throw new ConflictError(errorMessages.CUSTOMER_MANAGEMENT.ALREADY_EXISTS);
  }

  const customer = await updateCustomerManagementByUuid(uuid, req.currentUser.id, {
    ...data,
    updated_by: req.currentUser.id,
  });

  res
    .status(StatusCodes.OK)
    .json(response.ok(customer, { message: successMessages.CUSTOMER_MANAGEMENT.UPDATE }));
});

export const deleteCustomerManagement = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const deleted = await deleteCustomerManagementByUuid(
    req.params["uuid"] as string,
    req.currentUser.id,
  );

  if (!deleted) {
    throw new NotFoundError(errorMessages.CUSTOMER_MANAGEMENT.NOT_FOUND);
  }

  res
    .status(StatusCodes.OK)
    .json(response.ok(null, { message: successMessages.CUSTOMER_MANAGEMENT.DELETE }));
});

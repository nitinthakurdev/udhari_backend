import {
  checkTheCustomerAlreadyAdded,
  createCustomerManagement as createCustomerManagementService,
  customerConnectionReferencesExist,
  deleteCustomerManagementByUuid,
  findCustomerManagementByUuid,
  getConnectedUsers,
  getUsersConnectedToBusiness,
  updateCustomerManagementByUuid,
} from "@/services/customerManagementService";
import type {
  ICustomerManagementPayload,
  ICustomerManagementUpdatePayload,
} from "@/types/customerManagementTypes";
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

export const createCustomerManagement = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }

  const data = req.body as ICustomerManagementPayload;
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
    throw new ConflictError(errorMessages.CUSTOMER_MANAGEMENT.ALREADY_EXISTS);
  }

  const customer = await createCustomerManagementService({
    ...data,
    created_by: req.currentUser.id,
  });

  res.status(StatusCodes.CREATED).json(
    response.created(customer, {
      message: successMessages.CUSTOMER_MANAGEMENT.CREATE,
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

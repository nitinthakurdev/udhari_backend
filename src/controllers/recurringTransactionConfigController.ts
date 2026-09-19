import { businessModel } from "@/models/businessModel";
import { unitModel } from "@/models/unitModel";
import { findDirectUserConnection } from "@/services/customerManagementService";
import {
  createRecurringTransactionConfig as createConfig,
  deleteRecurringTransactionConfig as deleteConfig,
  findRecurringTransactionConfigContext,
  listRecurringTransactionConfigs as listConfigs,
  listUserRecurringTransactionConfigs,
  updateRecurringTransactionConfig as updateConfig,
} from "@/services/recurringTransactionConfigService";
import {
  checkBusinessTransitionAccess,
  checkTransitionAccess,
  isUnitAvailableForBusiness,
} from "@/services/transitionService";
import type {
  IRecurringTransactionConfigPayload,
  IRecurringTransactionConfigUpdatePayload,
} from "@/types/recurringTransactionConfigTypes";
import { AsyncHandler, HalSuccess, NotFoundError, UnauthorizedError } from "hal-response";
import { StatusCodes } from "http-status-codes";
import { notifyUsers } from "@/socket";
import { sendScheduledTransitionNow } from "@/services/scheduledTransitionService";

const response = new HalSuccess();
const authenticationError = "Authentication is required to access this resource.";
const notFoundError = "Configuration not found or you do not have permission to manage it.";

const ownedBusiness = (uuid: string, ownerId: number) =>
  businessModel.findOne({ where: { uuid, created_by: ownerId }, attributes: ["id"] });

export const listRecurringTransactionConfigs = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError(authenticationError);
  const business = await ownedBusiness(req.params["businessUuid"] as string, req.currentUser.id);
  if (!business) throw new NotFoundError("Business not found.");
  const configs = await listConfigs(business.id, req.currentUser.id);
  res
    .status(StatusCodes.OK)
    .json(response.ok(configs, { message: "Configurations fetched successfully." }));
});

export const listCurrentUserRecurringTransactionConfigs = AsyncHandler(
  async (req, res): Promise<void> => {
    if (!req.currentUser) throw new UnauthorizedError(authenticationError);
    const configs = await listUserRecurringTransactionConfigs(req.currentUser.id);
    res
      .status(StatusCodes.OK)
      .json(response.ok(configs, { message: "Configurations fetched successfully." }));
  },
);

export const createRecurringTransactionConfig = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError(authenticationError);
  const data = req.body as IRecurringTransactionConfigPayload;
  const roleSlug = req.currentUser.user_role?.slug;
  const business =
    roleSlug === "business"
      ? await ownedBusiness(data.business_uuid ?? "", req.currentUser.id)
      : null;
  if (roleSlug === "business" && !business) throw new NotFoundError("Business not found.");
  const customerId = data.customer_id ?? null;
  let customerBusinessId: number | null = null;
  let targetBusinessId: number | null = null;
  let attachedUserId: number | null = customerId;
  if (roleSlug === "business" && business) {
    if (data.customer_business_uuid) {
      const targetBusiness = await businessModel.findOne({
        where: { uuid: data.customer_business_uuid },
        attributes: ["id", "created_by"],
      });
      if (!targetBusiness) throw new NotFoundError("Connected business not found.");
      targetBusinessId = targetBusiness.id;
      const access = await checkBusinessTransitionAccess(
        data.business_uuid ?? "",
        targetBusiness.id,
        req.currentUser.id,
      );
      if (!access.connectionExists) throw new NotFoundError("Connected business not found.");
      customerBusinessId = targetBusiness.id;
      attachedUserId = targetBusiness.created_by;
    } else {
      if (!customerId) throw new NotFoundError("Select a connected customer.");
      const access = await checkTransitionAccess(customerId, business.id, req.currentUser.id);
      if (!access.customerExists || !access.connectionExists || !access.canAccess) {
        throw new NotFoundError("Connected customer not found.");
      }
    }
  } else {
    if (data.customer_business_uuid) {
      const targetBusiness = await businessModel.findOne({
        where: { uuid: data.customer_business_uuid },
        attributes: ["id", "created_by"],
      });
      if (!targetBusiness) throw new NotFoundError("Connected business not found.");
      const access = await checkTransitionAccess(
        req.currentUser.id,
        targetBusiness.id,
        req.currentUser.id,
      );
      if (!access.connectionExists) throw new NotFoundError("Connected business not found.");
      customerBusinessId = targetBusiness.id;
      targetBusinessId = targetBusiness.id;
      attachedUserId = targetBusiness.created_by;
    } else {
      if (!customerId) throw new NotFoundError("Select a connected user.");
      const connection = await findDirectUserConnection(req.currentUser.id, customerId);
      if (connection?.request_status !== "approved") {
        throw new NotFoundError("Connected user not found.");
      }
    }
  }
  const unitIsAvailable = data.unit_id
    ? business || targetBusinessId
      ? await isUnitAvailableForBusiness(data.unit_id, business?.id ?? targetBusinessId ?? 0)
      : Boolean(await unitModel.findByPk(data.unit_id, { attributes: ["id"] }))
    : true;
  if (!unitIsAvailable) {
    throw new NotFoundError("Selected unit is not available for this business.");
  }
  const config = await createConfig({
    business_id: business?.id ?? null,
    customer_id: customerId,
    customer_business_id: customerBusinessId,
    type: data.type,
    name: data.name,
    unit_id: data.unit_id,
    quantity: data.quantity,
    unit_price: data.unit_price,
    week_days: data.week_days,
    time_ranges: data.time_ranges,
    created_by: req.currentUser.id,
  });
  if (config && attachedUserId && attachedUserId !== req.currentUser.id) {
    notifyUsers([attachedUserId], {
      type: "transition.updated",
      title: "New scheduled configuration",
      message: `${req.currentUser.first_name} scheduled ${config.name} with you.`,
      data: { configuration_uuid: config.uuid },
    });
  }
  res
    .status(StatusCodes.CREATED)
    .json(response.created(config, { message: "Configuration created successfully." }));
});

export const updateRecurringTransactionConfig = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError(authenticationError);
  const uuid = req.params["uuid"] as string;
  const data = req.body as IRecurringTransactionConfigUpdatePayload;
  const current = await findRecurringTransactionConfigContext(uuid, req.currentUser.id);
  if (!current) throw new NotFoundError(notFoundError);
  if (data.unit_id) {
    const unitIsAvailable = current.business_id
      ? await isUnitAvailableForBusiness(data.unit_id, current.business_id)
      : Boolean(await unitModel.findByPk(data.unit_id, { attributes: ["id"] }));
    if (!unitIsAvailable) throw new NotFoundError("Selected unit is not available.");
  }
  const config = await updateConfig(uuid, req.currentUser.id, data);
  if (!config) throw new NotFoundError(notFoundError);
  res
    .status(StatusCodes.OK)
    .json(response.ok(config, { message: "Configuration updated successfully." }));
});

export const deleteRecurringTransactionConfig = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError(authenticationError);
  const deleted = await deleteConfig(req.params["uuid"] as string, req.currentUser.id);
  if (!deleted) throw new NotFoundError(notFoundError);
  res
    .status(StatusCodes.OK)
    .json(response.ok(null, { message: "Configuration deleted successfully." }));
});

export const sendRecurringTransactionConfigNow = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) throw new UnauthorizedError(authenticationError);
  const transition = await sendScheduledTransitionNow(
    req.params["uuid"] as string,
    req.currentUser.id,
    req.body as {
      name: string;
      unit_id: number | null;
      quantity: number | null;
      unit_price: number;
      total_price: number;
      comment: string | null;
      occurrence_key: string;
      action: "edit" | "approved" | "rejected";
    },
  );
  if (!transition) {
    throw new NotFoundError("Configuration not found, unavailable, or already actioned.");
  }
  res.status(StatusCodes.CREATED).json(
    response.created(transition, {
      message: "Scheduled transition request sent successfully.",
    }),
  );
});

import { businessModel } from "@/models/businessModel";
import { recurringTransactionConfigModel } from "@/models/recurringTransactionConfigModel";
import { transitionsModel } from "@/models/transitionModel";
import {
  createTransition,
  findTransitionByUuid,
  updateTransitionByUuid,
} from "@/services/transitionService";
import { notifyUsers } from "@/socket";
import type { IRecurringTransactionConfigSchema } from "@/types/recurringTransactionConfigTypes";
import { UniqueConstraintError } from "sequelize";

interface ScheduledTransitionAction {
  name: string;
  unit_id: number | null;
  quantity: number | null;
  unit_price: number;
  total_price: number;
  comment: string | null;
  occurrence_key: string;
  action: "edit" | "approved" | "rejected";
}

const resolveScheduledTransitionParties = async (config: IRecurringTransactionConfigSchema) => {
  const [sourceBusiness, targetBusiness] = await Promise.all([
    config.business_id
      ? businessModel.findByPk(config.business_id, { attributes: ["created_by"] })
      : null,
    config.customer_business_id
      ? businessModel.findByPk(config.customer_business_id, { attributes: ["created_by"] })
      : null,
  ]);
  const creatorId = config.created_by ?? sourceBusiness?.created_by ?? null;
  const attachedUserId = config.customer_id ?? targetBusiness?.created_by ?? null;
  if (!creatorId || !attachedUserId) return null;

  // A personal user scheduling with a business is represented like every other
  // user-to-business transition: the user is the customer and the target is the
  // creditor business. Direct user and business-owned schedules already store
  // their creditor side in business_id/created_by respectively.
  const userToBusiness = config.business_id === null && config.customer_business_id !== null;
  return {
    creatorId,
    attachedUserId,
    transitionParties: userToBusiness
      ? {
          business_id: config.customer_business_id,
          customer_user_id: creatorId,
          customer_business_id: null,
          business_user_id: attachedUserId,
        }
      : {
          business_id: config.business_id,
          customer_user_id: attachedUserId,
          customer_business_id: config.customer_business_id,
          business_user_id: creatorId,
        },
  };
};

export const sendScheduledTransitionNow = async (
  configUuid: string,
  actorId: number,
  data: ScheduledTransitionAction,
) => {
  const configModel = await recurringTransactionConfigModel.findOne({
    where: { uuid: configUuid },
  });
  if (!configModel) return undefined;
  const config = configModel.dataValues;
  const parties = await resolveScheduledTransitionParties(config);
  if (!parties || ![parties.creatorId, parties.attachedUserId].includes(actorId)) {
    return undefined;
  }
  const { creatorId, attachedUserId, transitionParties } = parties;

  try {
    const created = await createTransition({
      ...transitionParties,
      unit_id: data.unit_id,
      product_name: data.name,
      product_qty: data.quantity ?? 1,
      product_unit_price: data.unit_price,
      total_price: data.total_price,
      request_status: "pending",
      balance_type: "payable",
      comment: data.comment,
      created_by: creatorId,
      recurring_config_id: config.id,
      schedule_occurrence_key: data.occurrence_key,
    });
    const requestStatus = data.action === "edit" ? "pending" : data.action;
    const transition = await updateTransitionByUuid(created.uuid, actorId, {
      request_status: requestStatus,
      updated_by: actorId,
    });
    if (!transition) return undefined;
    notifyUsers(
      [creatorId, attachedUserId].filter((userId) => userId !== actorId),
      {
        type: "transition.created",
        title: "Scheduled transition updated",
        message: `${data.name} was ${data.action === "edit" ? "submitted for approval" : data.action}.`,
        data: { transition_uuid: transition.uuid, configuration_uuid: config.uuid },
      },
    );
    return transition;
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const existing = await transitionsModel.findOne({
        where: {
          recurring_config_id: config.id,
          schedule_occurrence_key: data.occurrence_key,
        },
        attributes: ["uuid"],
      });
      return existing ? findTransitionByUuid(existing.uuid, actorId) : null;
    }
    throw error;
  }
};

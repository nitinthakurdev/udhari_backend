import { subscriptionModel } from "@/models/subscriptionModel";
import { roleModel } from "@/models/roleModel";
import type {
  ISubscriptionCreatePayload,
  ISubscriptionPricingPlan,
  ISubscriptionPublic,
  ISubscriptionSchema,
  ISubscriptionUpdateData,
} from "@/types/subscriptionTypes";
import { Op } from "sequelize";

const subscriptionAttributes: string[] = [
  "uuid",
  "name",
  "description",
  "features",
  "price",
  "currency",
  "duration",
  "duration_type",
  "is_active",
  "role_id",
  "created_at",
  "updated_at",
];

const toPublicSubscription = (subscription: ISubscriptionSchema): ISubscriptionPublic => ({
  uuid: subscription.uuid,
  name: subscription.name,
  description: subscription.description,
  features: Array.isArray(subscription.features) ? subscription.features : [],
  price: Number(subscription.price),
  currency: subscription.currency,
  duration: subscription.duration,
  duration_type: subscription.duration_type,
  is_active: subscription.is_active,
  role_id: subscription.role_id,
  created_at: subscription.created_at,
  updated_at: subscription.updated_at,
});

export const createSubscription = async (
  data: ISubscriptionCreatePayload,
): Promise<ISubscriptionPublic> => {
  const subscription = await subscriptionModel.create(data);
  return toPublicSubscription(subscription.dataValues);
};

export const findSubscriptions = async (): Promise<ISubscriptionPublic[]> => {
  const subscriptions = await subscriptionModel.findAll({
    attributes: subscriptionAttributes,
    order: [["created_at", "DESC"]],
  });

  return subscriptions.map((subscription) => toPublicSubscription(subscription.dataValues));
};

export const findPublicSubscriptions = async (): Promise<ISubscriptionPricingPlan[]> => {
  const roles = await roleModel.findAll({
    attributes: ["id", "name", "slug"],
    where: { slug: { [Op.in]: ["user", "business"] } },
  });
  const publicRoles = new Map(
    roles.map((role) => [role.id, { name: role.name, slug: role.slug as "user" | "business" }]),
  );
  const subscriptions = await subscriptionModel.findAll({
    attributes: subscriptionAttributes,
    order: [
      ["price", "ASC"],
      ["duration", "ASC"],
      ["name", "ASC"],
    ],
    where: { is_active: true, role_id: { [Op.in]: [...publicRoles.keys()] } },
  });
  const roleOrder = { user: 0, business: 1 } as const;

  return subscriptions
    .flatMap((subscription) => {
      const plan = toPublicSubscription(subscription.dataValues);
      const role = publicRoles.get(plan.role_id);
      return role ? [{ ...plan, role }] : [];
    })
    .sort((left, right) => roleOrder[left.role.slug] - roleOrder[right.role.slug]);
};

export const findSubscriptionByUuid = async (
  uuid: string,
): Promise<ISubscriptionPublic | undefined> => {
  const subscription = await subscriptionModel.findOne({
    where: { uuid },
    attributes: subscriptionAttributes,
  });

  return subscription ? toPublicSubscription(subscription.dataValues) : undefined;
};

export const findSubscriptionByNameAndRole = async (
  name: string,
  roleId: number,
  excludeUuid?: string,
): Promise<ISubscriptionPublic | undefined> => {
  const subscription = await subscriptionModel.findOne({
    where: {
      name,
      role_id: roleId,
      ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
    },
    attributes: subscriptionAttributes,
  });

  return subscription ? toPublicSubscription(subscription.dataValues) : undefined;
};

export const updateSubscriptionByUuid = async (
  uuid: string,
  data: ISubscriptionUpdateData,
): Promise<ISubscriptionPublic | undefined> => {
  const subscription = await subscriptionModel.findOne({ where: { uuid } });

  if (!subscription) return undefined;

  const updatedSubscription = await subscription.update(data);
  return toPublicSubscription(updatedSubscription.dataValues);
};

export const deleteSubscriptionByUuid = async (
  uuid: string,
  deletedBy: number,
): Promise<ISubscriptionPublic | undefined> => {
  const subscription = await subscriptionModel.findOne({ where: { uuid } });

  if (!subscription) return undefined;

  await subscription.update({ deleted_by: deletedBy });
  const deletedSubscription = toPublicSubscription(subscription.dataValues);
  await subscription.destroy();

  return deletedSubscription;
};

import { subscriptionModel } from "@/models/subscriptionModel";
import { userModel } from "@/models/userModel";
import { userSubscriptionModel } from "@/models/userSubscriptionModel";
import type { ISubscriptionConfig, SubscriptionDurationType } from "@/types/subscriptionTypes";
import type {
  IUserSubscriptionCreateData,
  IUserSubscriptionPublic,
  IUserSubscriptionUpdateData,
} from "@/types/userSubscriptionTypes";
import { Op } from "sequelize";
import { sequelize } from "@/config/dbConfig";
import { calculateSubscriptionExpiry } from "@/services/subscriptionExpiryService";
import type { PaymentProvider } from "@/types/userSubscriptionTypes";

interface JoinedUserSubscription {
  uuid: string;
  expiry_at: Date;
  created_at: Date;
  updated_at: Date;
  payment_provider: PaymentProvider;
  auto_renew: boolean;
  user: {
    uuid: string;
    first_name: string;
    last_name: string | null;
    email: string;
    username: string;
  };
  subscription: {
    uuid: string;
    name: string;
    description: string;
    features: string[];
    config: ISubscriptionConfig;
    price: number | string;
    currency: string;
    duration: number;
    duration_type: SubscriptionDurationType;
    is_active: boolean;
    auto_renewal_enabled: boolean;
  };
}

const include = [
  {
    model: userModel,
    as: "user",
    attributes: ["uuid", "first_name", "last_name", "email", "username"],
  },
  {
    model: subscriptionModel,
    as: "subscription",
    attributes: [
      "uuid",
      "name",
      "description",
      "features",
      "config",
      "price",
      "currency",
      "duration",
      "duration_type",
      "is_active",
      "auto_renewal_enabled",
    ],
  },
];

const toPublicUserSubscription = (data: JoinedUserSubscription): IUserSubscriptionPublic => ({
  uuid: data.uuid,
  expiry_at: data.expiry_at,
  created_at: data.created_at,
  updated_at: data.updated_at,
  payment_provider: data.payment_provider,
  auto_renew: data.auto_renew,
  user: data.user,
  subscription: {
    ...data.subscription,
    price: Number(data.subscription.price),
  },
});

const findWithDetails = async (where: Record<string, unknown>) => {
  const assignment = await userSubscriptionModel.findOne({ where, include });
  if (!assignment) return undefined;
  return toPublicUserSubscription(
    assignment.get({ plain: true }) as unknown as JoinedUserSubscription,
  );
};

export const findUserIdByUuid = async (uuid: string): Promise<number | undefined> => {
  const user = await userModel.findOne({ where: { uuid }, attributes: ["id"] });
  return user?.id;
};

export const findSubscriptionIdByUuid = async (uuid: string): Promise<number | undefined> => {
  const subscription = await subscriptionModel.findOne({ where: { uuid }, attributes: ["id"] });
  return subscription?.id;
};

export const findActiveUserSubscription = async (
  userId: number,
  excludeUuid?: string,
): Promise<IUserSubscriptionPublic | undefined> =>
  findWithDetails({
    user_id: userId,
    expiry_at: { [Op.gt]: new Date() },
    ...(excludeUuid ? { uuid: { [Op.ne]: excludeUuid } } : {}),
  });

export class FreeSubscriptionError extends Error {}

export const activateFreeSubscription = async (
  userId: number,
  subscriptionUuid: string,
): Promise<IUserSubscriptionPublic | undefined> => {
  const assignmentId = await sequelize.transaction(async (transaction) => {
    const [user, subscription] = await Promise.all([
      userModel.findByPk(userId, { attributes: ["id", "role_id"], transaction }),
      subscriptionModel.findOne({
        where: { uuid: subscriptionUuid, is_active: true },
        transaction,
      }),
    ]);
    if (!user || !subscription) return undefined;
    if (user.role_id !== subscription.role_id) return undefined;
    if (Number(subscription.price) !== 0) {
      throw new FreeSubscriptionError("Only free plans can be activated without payment");
    }

    const activeAssignments = await userSubscriptionModel.findAll({
      where: { user_id: userId, expiry_at: { [Op.gt]: new Date() } },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (
      activeAssignments.some(
        (assignment) =>
          assignment.payment_provider === "RAZORPAY" ||
          assignment.payment_provider === "GOOGLE_PLAY",
      )
    ) {
      throw new FreeSubscriptionError(
        "Your paid subscription must end before switching to a free plan",
      );
    }
    const currentPlan = activeAssignments.find(
      (assignment) => assignment.subscription_id === subscription.id,
    );
    if (currentPlan) {
      await currentPlan.update(
        {
          payment_provider: "FREE",
          auto_renew: subscription.auto_renewal_enabled,
          updated_by: userId,
        },
        { transaction },
      );
      return currentPlan.id;
    }
    await Promise.all(activeAssignments.map((assignment) => assignment.destroy({ transaction })));

    const previousFreeAssignment = await userSubscriptionModel.findOne({
      where: {
        user_id: userId,
        subscription_id: subscription.id,
        payment_provider: "FREE",
      },
      paranoid: false,
      order: [["created_at", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const expiryAt = calculateSubscriptionExpiry(subscription.dataValues);
    if (previousFreeAssignment) {
      if (previousFreeAssignment.deleted_at) await previousFreeAssignment.restore({ transaction });
      await previousFreeAssignment.update(
        {
          expiry_at: expiryAt,
          auto_renew: subscription.auto_renewal_enabled,
          updated_by: userId,
        },
        { transaction },
      );
      return previousFreeAssignment.id;
    }

    const created = await userSubscriptionModel.create(
      {
        user_id: userId,
        subscription_id: subscription.id,
        expiry_at: expiryAt,
        payment_provider: "FREE",
        auto_renew: subscription.auto_renewal_enabled,
        created_by: userId,
        updated_by: userId,
      },
      { transaction },
    );
    return created.id;
  });
  return assignmentId ? findWithDetails({ id: assignmentId }) : undefined;
};

export const renewFreeSubscriptionIfEligible = async (userId: number): Promise<void> => {
  await sequelize.transaction(async (transaction) => {
    const assignment = await userSubscriptionModel.findOne({
      where: {
        user_id: userId,
        payment_provider: "FREE",
        auto_renew: true,
        expiry_at: { [Op.lte]: new Date() },
      },
      order: [["expiry_at", "DESC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!assignment) return;

    const subscription = await subscriptionModel.findByPk(assignment.subscription_id, {
      transaction,
    });
    if (
      !subscription ||
      !subscription.is_active ||
      !subscription.auto_renewal_enabled ||
      Number(subscription.price) !== 0
    ) {
      await assignment.update({ auto_renew: false, updated_by: userId }, { transaction });
      return;
    }
    await assignment.update(
      {
        expiry_at: calculateSubscriptionExpiry(subscription.dataValues),
        updated_by: userId,
      },
      { transaction },
    );
  });
};

export const createUserSubscription = async (
  data: IUserSubscriptionCreateData,
): Promise<IUserSubscriptionPublic> => {
  const assignment = await userSubscriptionModel.create(data);
  const created = await findWithDetails({ id: assignment.id });
  if (!created) throw new Error("Created user subscription could not be loaded");
  return created;
};

export const findUserSubscriptions = async (): Promise<IUserSubscriptionPublic[]> => {
  const assignments = await userSubscriptionModel.findAll({
    include,
    order: [["created_at", "DESC"]],
  });
  return assignments.map((assignment) =>
    toPublicUserSubscription(assignment.get({ plain: true }) as unknown as JoinedUserSubscription),
  );
};

export const findUserSubscriptionByUuid = async (
  uuid: string,
): Promise<IUserSubscriptionPublic | undefined> => findWithDetails({ uuid });

export const updateUserSubscriptionByUuid = async (
  uuid: string,
  data: IUserSubscriptionUpdateData,
): Promise<IUserSubscriptionPublic | undefined> => {
  const assignment = await userSubscriptionModel.findOne({ where: { uuid } });
  if (!assignment) return undefined;
  await assignment.update(data);
  return findWithDetails({ id: assignment.id });
};

export const deleteUserSubscriptionByUuid = async (
  uuid: string,
): Promise<IUserSubscriptionPublic | undefined> => {
  const assignment = await userSubscriptionModel.findOne({ where: { uuid } });
  if (!assignment) return undefined;
  const deleted = await findWithDetails({ id: assignment.id });
  await assignment.destroy();
  return deleted;
};

import { config } from "@/config/envConfig";
import { sequelize } from "@/config/dbConfig";
import { subscriptionModel } from "@/models/subscriptionModel";
import { userModel } from "@/models/userModel";
import { userSubscriptionModel } from "@/models/userSubscriptionModel";
import type { IGooglePlayVerificationResponse } from "@/types/paymentTypes";
import { GoogleAuth } from "google-auth-library";
import { Op } from "sequelize";

const androidPublisherScope = "https://www.googleapis.com/auth/androidpublisher";
const entitledStates = new Set([
  "SUBSCRIPTION_STATE_ACTIVE",
  "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  "SUBSCRIPTION_STATE_CANCELED",
]);

interface GooglePlayLineItem {
  productId?: string;
  expiryTime?: string;
  latestSuccessfulOrderId?: string;
  autoRenewingPlan?: { autoRenewEnabled?: boolean };
}

interface GooglePlaySubscriptionPurchase {
  subscriptionState?: string;
  acknowledgementState?: string;
  latestOrderId?: string;
  externalAccountIdentifiers?: {
    obfuscatedExternalAccountId?: string;
  };
  lineItems?: GooglePlayLineItem[];
}

export class GooglePlayPurchaseError extends Error {}

const getGooglePlayClient = async () => {
  if (!config.GOOGLE_PLAY_PACKAGE_NAME || !config.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) {
    throw new Error("Google Play Billing is not configured");
  }

  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(config.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON) as Record<string, unknown>;
  } catch {
    throw new Error("Google Play service account JSON is invalid");
  }

  const auth = new GoogleAuth({ credentials, scopes: [androidPublisherScope] });
  return auth.getClient();
};

const getPackageName = () => {
  if (!config.GOOGLE_PLAY_PACKAGE_NAME) throw new Error("Google Play Billing is not configured");
  return encodeURIComponent(config.GOOGLE_PLAY_PACKAGE_NAME);
};

const getGoogleSubscription = async (
  purchaseToken: string,
): Promise<GooglePlaySubscriptionPurchase> => {
  const client = await getGooglePlayClient();
  const packageName = getPackageName();
  const token = encodeURIComponent(purchaseToken);
  try {
    const response = await client.request<GooglePlaySubscriptionPurchase>({
      url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${token}`,
      method: "GET",
    });
    return response.data;
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 400 || status === 404) {
      throw new GooglePlayPurchaseError("Google Play purchase token is invalid");
    }
    throw error;
  }
};

const acknowledgeGoogleSubscription = async (purchaseToken: string, productId: string) => {
  const client = await getGooglePlayClient();
  const packageName = getPackageName();
  const subscriptionId = encodeURIComponent(productId);
  const token = encodeURIComponent(purchaseToken);
  await client.request({
    url: `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${subscriptionId}/tokens/${token}:acknowledge`,
    method: "POST",
    data: {},
  });
};

export const verifyGooglePlaySubscription = async (
  userId: number,
  subscriptionUuid: string,
  purchaseToken: string,
): Promise<IGooglePlayVerificationResponse | undefined> => {
  const [user, subscription] = await Promise.all([
    userModel.findByPk(userId, { attributes: ["id", "uuid", "role_id"] }),
    subscriptionModel.findOne({ where: { uuid: subscriptionUuid, is_active: true } }),
  ]);
  if (!user || !subscription) return undefined;
  if (user.role_id !== subscription.role_id) return undefined;

  const productId = subscription.google_play_product_id;
  if (!productId) {
    throw new GooglePlayPurchaseError("This plan is not configured in Google Play");
  }

  const purchase = await getGoogleSubscription(purchaseToken);
  const lineItem = purchase.lineItems?.find((item) => item.productId === productId);
  if (!lineItem?.expiryTime) {
    throw new GooglePlayPurchaseError("Google Play purchase does not match this plan");
  }
  if (purchase.externalAccountIdentifiers?.obfuscatedExternalAccountId !== user.uuid) {
    throw new GooglePlayPurchaseError("Google Play purchase belongs to another account");
  }
  if (!purchase.subscriptionState || !entitledStates.has(purchase.subscriptionState)) {
    throw new GooglePlayPurchaseError("Google Play subscription is not active");
  }

  const expiryAt = new Date(lineItem.expiryTime);
  if (Number.isNaN(expiryAt.getTime()) || expiryAt <= new Date()) {
    throw new GooglePlayPurchaseError("Google Play subscription has expired");
  }
  const orderId = lineItem.latestSuccessfulOrderId ?? purchase.latestOrderId ?? null;

  await sequelize.transaction(async (transaction) => {
    const existingPurchase = await userSubscriptionModel.findOne({
      where: { google_play_purchase_token: purchaseToken },
      paranoid: false,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (existingPurchase && existingPurchase.user_id !== user.id) {
      throw new GooglePlayPurchaseError("Google Play purchase belongs to another account");
    }

    const activeAssignments = await userSubscriptionModel.findAll({
      where: {
        user_id: user.id,
        expiry_at: { [Op.gt]: new Date() },
        ...(existingPurchase ? { id: { [Op.ne]: existingPurchase.id } } : {}),
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    await Promise.all(activeAssignments.map((assignment) => assignment.destroy({ transaction })));

    if (existingPurchase) {
      if (existingPurchase.deleted_at) await existingPurchase.restore({ transaction });
      await existingPurchase.update(
        {
          subscription_id: subscription.id,
          expiry_at: expiryAt,
          google_play_order_id: orderId,
          payment_provider: "GOOGLE_PLAY",
          auto_renew: lineItem.autoRenewingPlan?.autoRenewEnabled ?? false,
          updated_by: user.id,
        },
        { transaction },
      );
    } else {
      await userSubscriptionModel.create(
        {
          user_id: user.id,
          subscription_id: subscription.id,
          expiry_at: expiryAt,
          google_play_purchase_token: purchaseToken,
          google_play_order_id: orderId,
          payment_provider: "GOOGLE_PLAY",
          auto_renew: lineItem.autoRenewingPlan?.autoRenewEnabled ?? false,
          created_by: user.id,
          updated_by: user.id,
        },
        { transaction },
      );
    }
  });

  if (purchase.acknowledgementState === "ACKNOWLEDGEMENT_STATE_PENDING") {
    await acknowledgeGoogleSubscription(purchaseToken, productId);
  }

  return {
    verified: true,
    subscription_uuid: subscription.uuid,
    product_id: productId,
    subscription_state: purchase.subscriptionState,
    expiry_at: expiryAt,
  };
};

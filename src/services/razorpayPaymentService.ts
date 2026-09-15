import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { config } from "@/config/envConfig";
import { sequelize } from "@/config/dbConfig";
import { subscriptionModel } from "@/models/subscriptionModel";
import { userModel } from "@/models/userModel";
import { userSubscriptionModel } from "@/models/userSubscriptionModel";
import { calculateSubscriptionExpiry } from "@/services/subscriptionExpiryService";
import type {
  IRazorpayOrderResponse,
  IRazorpayPaymentVerificationResponse,
  IVerifyRazorpayPaymentPayload,
} from "@/types/paymentTypes";
import { Op } from "sequelize";

export class RazorpayPaymentError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "RazorpayPaymentError";
    this.statusCode = statusCode;
  }
}

const getRazorpay = () => {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    throw new RazorpayPaymentError("Razorpay is not configured", 500);
  }
  return new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET,
  });
};

const toPaise = (price: number): number => Math.round(price * 100);

export const createRazorpayOrder = async (
  userId: number,
  subscriptionUuid: string,
): Promise<IRazorpayOrderResponse | undefined> => {
  const [user, subscription] = await Promise.all([
    userModel.findByPk(userId, { attributes: ["id", "role_id"] }),
    subscriptionModel.findOne({ where: { uuid: subscriptionUuid, is_active: true } }),
  ]);
  if (user === null) return undefined;
  if (subscription === null) return undefined;
  if (user.role_id !== subscription.role_id) return undefined;

  const price = Number(subscription.price);
  const amount = toPaise(price);
  if (!Number.isFinite(price) || price <= 0) {
    throw new RazorpayPaymentError("Only paid plans require Razorpay Checkout");
  }
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw new RazorpayPaymentError("The minimum Razorpay order amount is 100 paise");
  }

  const order = await getRazorpay().orders.create({
    amount,
    currency: subscription.currency.toUpperCase(),
    receipt: `sub_${String(user.id)}_${String(Date.now())}`,
    notes: {
      user_id: user.id,
      subscription_id: subscription.id,
      subscription_uuid: subscription.uuid,
    },
  });

  return {
    order_id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
  };
};

const isValidSignature = (payload: IVerifyRazorpayPaymentPayload): boolean => {
  if (!config.RAZORPAY_KEY_SECRET) return false;
  const expected = createHmac("sha256", config.RAZORPAY_KEY_SECRET)
    .update(`${payload.razorpay_order_id}|${payload.razorpay_payment_id}`)
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(payload.razorpay_signature, "utf8");
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

export const verifyRazorpayPayment = async (
  userId: number,
  payload: IVerifyRazorpayPaymentPayload,
): Promise<IRazorpayPaymentVerificationResponse> => {
  if (!isValidSignature(payload)) {
    throw new RazorpayPaymentError("Razorpay payment signature does not match");
  }

  const razorpay = getRazorpay();
  const [order, initialPayment] = await Promise.all([
    razorpay.orders.fetch(payload.razorpay_order_id),
    razorpay.payments.fetch(payload.razorpay_payment_id),
  ]);
  if (initialPayment.order_id !== order.id) {
    throw new RazorpayPaymentError("Payment does not belong to this Razorpay order");
  }
  const orderUserId = Number(order.notes?.["user_id"]);
  const subscriptionId = Number(order.notes?.["subscription_id"]);
  if (orderUserId !== userId || !Number.isSafeInteger(subscriptionId)) {
    throw new RazorpayPaymentError("Razorpay order metadata is invalid");
  }
  if (
    Number(initialPayment.amount) !== Number(order.amount) ||
    initialPayment.currency.toUpperCase() !== order.currency.toUpperCase()
  ) {
    throw new RazorpayPaymentError("Razorpay payment amount does not match the order");
  }

  const payment =
    initialPayment.status === "authorized"
      ? await razorpay.payments.capture(initialPayment.id, order.amount, order.currency)
      : initialPayment;
  if (payment.status !== "captured" || !payment.captured) {
    throw new RazorpayPaymentError("Razorpay payment has not been captured");
  }

  return sequelize.transaction(async (transaction) => {
    const existing = await userSubscriptionModel.findOne({
      where: { razorpay_order_id: order.id },
      paranoid: false,
      transaction,
    });
    if (existing) {
      return {
        verified: true,
        order_id: order.id,
        payment_id: payment.id,
        user_subscription_uuid: existing.uuid,
      };
    }

    const subscription = await subscriptionModel.findByPk(subscriptionId, { transaction });
    if (subscription === null) {
      throw new RazorpayPaymentError("The purchased subscription no longer exists");
    }
    const user = await userModel.findByPk(userId, { attributes: ["id", "role_id"], transaction });
    if (user === null) {
      throw new RazorpayPaymentError("The payment user no longer exists");
    }
    if (user.role_id !== subscription.role_id) {
      throw new RazorpayPaymentError("The purchased subscription is not available to this user");
    }
    const expectedAmount = toPaise(Number(subscription.price));
    if (
      expectedAmount !== Number(order.amount) ||
      subscription.currency.toUpperCase() !== order.currency.toUpperCase()
    ) {
      throw new RazorpayPaymentError(
        "The subscription price has changed; payment cannot be applied",
      );
    }

    const activeAssignments = await userSubscriptionModel.findAll({
      where: { user_id: userId, expiry_at: { [Op.gt]: new Date() } },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    await Promise.all(activeAssignments.map((assignment) => assignment.destroy({ transaction })));

    const assignment = await userSubscriptionModel.create(
      {
        user_id: userId,
        subscription_id: subscription.id,
        expiry_at: calculateSubscriptionExpiry(subscription.dataValues),
        razorpay_order_id: order.id,
        razorpay_payment_id: payment.id,
        payment_provider: "RAZORPAY",
        auto_renew: false,
        created_by: userId,
        updated_by: userId,
      },
      { transaction },
    );

    return {
      verified: true,
      order_id: order.id,
      payment_id: payment.id,
      user_subscription_uuid: assignment.uuid,
    };
  });
};

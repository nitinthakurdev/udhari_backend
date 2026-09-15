import {
  createRazorpayOrder,
  RazorpayPaymentError,
  verifyRazorpayPayment,
} from "@/services/razorpayPaymentService";
import {
  GooglePlayPurchaseError,
  verifyGooglePlaySubscription,
} from "@/services/googlePlayPaymentService";
import type {
  ICreateRazorpayOrderPayload,
  IVerifyRazorpayPaymentPayload,
  IVerifyGooglePlaySubscriptionPayload,
} from "@/types/paymentTypes";
import {
  AsyncHandler,
  BadRequestError,
  HalSuccess,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "hal-response";
import { StatusCodes } from "http-status-codes";
import errorMessages from "../../errorMessages.json";
import successMessages from "../../successMessages.json";

const response = new HalSuccess();

const getStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return undefined;
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
};

export const createOrder = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const data = req.body as ICreateRazorpayOrderPayload;
  let order;
  try {
    order = await createRazorpayOrder(req.currentUser.id, data.subscription_uuid);
  } catch (error) {
    if (error instanceof RazorpayPaymentError && error.statusCode === 400) {
      throw new BadRequestError(errorMessages.PAYMENT.PAID_PLAN_REQUIRED);
    }
    if (getStatusCode(error) === StatusCodes.UNAUTHORIZED) {
      throw new UnauthorizedError(errorMessages.PAYMENT.RAZORPAY_AUTH_FAILED);
    }
    console.error("Razorpay order creation failed:", error);
    throw new InternalServerError(errorMessages.PAYMENT.ORDER_FAILED);
  }
  if (!order) throw new NotFoundError(errorMessages.PAYMENT.SUBSCRIPTION_NOT_FOUND);
  res
    .status(StatusCodes.CREATED)
    .json(response.created(order, { message: successMessages.PAYMENT.ORDER_CREATED }));
});

export const verifyPayment = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const data = req.body as IVerifyRazorpayPaymentPayload;
  try {
    const result = await verifyRazorpayPayment(req.currentUser.id, data);
    res
      .status(StatusCodes.OK)
      .json(response.ok(result, { message: successMessages.PAYMENT.PAYMENT_VERIFIED }));
  } catch (error) {
    if (error instanceof RazorpayPaymentError) {
      throw new BadRequestError(error.message);
    }
    if (getStatusCode(error) === StatusCodes.UNAUTHORIZED) {
      throw new UnauthorizedError(errorMessages.PAYMENT.RAZORPAY_AUTH_FAILED);
    }
    console.error("Razorpay payment verification failed:", error);
    throw new InternalServerError(errorMessages.PAYMENT.VERIFICATION_FAILED);
  }
});

export const verifyGooglePlayPurchase = AsyncHandler(async (req, res): Promise<void> => {
  if (!req.currentUser) {
    throw new UnauthorizedError(errorMessages.AUTHORIZATION.AUTHENTICATION_REQUIRED);
  }
  const data = req.body as IVerifyGooglePlaySubscriptionPayload;
  let result;
  try {
    result = await verifyGooglePlaySubscription(
      req.currentUser.id,
      data.subscription_uuid,
      data.purchase_token,
    );
  } catch (error) {
    if (error instanceof GooglePlayPurchaseError) {
      throw new BadRequestError(error.message);
    }
    console.error("Google Play subscription verification failed:", error);
    throw new InternalServerError(errorMessages.PAYMENT.GOOGLE_PLAY_VERIFICATION_FAILED);
  }
  if (!result) throw new NotFoundError(errorMessages.PAYMENT.SUBSCRIPTION_NOT_FOUND);
  res
    .status(StatusCodes.OK)
    .json(response.ok(result, { message: successMessages.PAYMENT.GOOGLE_PLAY_VERIFIED }));
});

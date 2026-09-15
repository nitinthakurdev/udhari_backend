import {
  createOrder,
  verifyGooglePlayPurchase,
  verifyPayment,
} from "@/controllers/paymentController";
import {
  validateCreateRazorpayOrder,
  validateGooglePlaySubscription,
  validateVerifyRazorpayPayment,
} from "@/validations/paymentValidation";
import { Router } from "express";

export const paymentRoutes = (): Router => {
  const routes = Router();
  routes.route("/razorpay/orders").post(validateCreateRazorpayOrder, createOrder);
  routes.route("/razorpay/verify").post(validateVerifyRazorpayPayment, verifyPayment);
  routes
    .route("/google-play/subscription/verify")
    .post(validateGooglePlaySubscription, verifyGooglePlayPurchase);
  return routes;
};

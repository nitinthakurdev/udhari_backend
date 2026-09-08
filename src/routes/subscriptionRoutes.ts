import {
  createSubscription,
  deleteSubscription,
  getSubscription,
  listSubscriptions,
  updateSubscription,
} from "@/controllers/subscriptionController";
import {
  validateCreateSubscription,
  validateSubscriptionUuid,
  validateUpdateSubscription,
} from "@/validations/subscriptionValidation";
import { Router } from "express";

export const subscriptionRoutes = (): Router => {
  const routes = Router();

  routes.route("/list").get(listSubscriptions);
  routes.route("/create").post(validateCreateSubscription, createSubscription);
  routes.route("/details/:uuid").get(validateSubscriptionUuid, getSubscription);
  routes.route("/update/:uuid").patch(validateUpdateSubscription, updateSubscription);
  routes.route("/delete/:uuid").delete(validateSubscriptionUuid, deleteSubscription);

  return routes;
};

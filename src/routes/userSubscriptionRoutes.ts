import {
  createUserSubscription,
  deleteUserSubscription,
  getCurrentUserSubscription,
  getUserSubscription,
  listUserSubscriptions,
  updateUserSubscription,
  activateFreeUserSubscription,
} from "@/controllers/userSubscriptionController";
import { requireAdmin } from "@/middlewares/roleAuthorizationMiddleware";
import {
  validateCreateUserSubscription,
  validateUpdateUserSubscription,
  validateUserSubscriptionUuid,
  validateFreeSubscription,
} from "@/validations/userSubscriptionValidation";
import { Router } from "express";

export const userSubscriptionRoutes = (): Router => {
  const routes = Router();

  routes.route("/current").get(getCurrentUserSubscription);
  routes.route("/free/activate").post(validateFreeSubscription, activateFreeUserSubscription);
  routes.use(requireAdmin);
  routes.route("/list").get(listUserSubscriptions);
  routes.route("/details/:uuid").get(validateUserSubscriptionUuid, getUserSubscription);
  routes.route("/create").post(validateCreateUserSubscription, createUserSubscription);
  routes.route("/update/:uuid").patch(validateUpdateUserSubscription, updateUserSubscription);
  routes.route("/delete/:uuid").delete(validateUserSubscriptionUuid, deleteUserSubscription);

  return routes;
};

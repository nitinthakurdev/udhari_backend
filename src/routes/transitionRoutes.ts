import {
  createTransition,
  cancelTransition,
  getTransition,
  listBusinessTransitions,
  listTransitions,
  receiveTransitionPayment,
  updateTransition,
} from "@/controllers/transitionController";
import {
  validateCreateTransition,
  validateTransitionUuid,
  validateUpdateTransition,
} from "@/validations/transitionValidation";
import { Router } from "express";
import { validateBusinessUuid } from "@/validations/businessValidation";

export const transitionRoutes = (): Router => {
  const routes = Router();

  routes.route("/list").get(listTransitions);
  routes.route("/business/:uuid").get(validateBusinessUuid, listBusinessTransitions);
  routes.route("/create").post(validateCreateTransition, createTransition);
  routes.route("/details/:uuid").get(validateTransitionUuid, getTransition);
  routes.route("/update/:uuid").patch(validateUpdateTransition, updateTransition);
  routes.route("/cancel/:uuid").patch(validateTransitionUuid, cancelTransition);
  routes.route("/payment-received/:uuid").patch(validateTransitionUuid, receiveTransitionPayment);

  return routes;
};

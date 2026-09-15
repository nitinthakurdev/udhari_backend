import {
  createTransitions,
  createTransition,
  cancelTransition,
  getTransition,
  listBusinessTransitions,
  listTransitions,
  transitionSummary,
  businessTransitionSummary,
  updateTransition,
} from "@/controllers/transitionController";
import {
  validateBatchCreateTransition,
  validateCreateTransition,
  validateTransitionUuid,
  validateUpdateTransition,
  validateListTransitions,
} from "@/validations/transitionValidation";
import { Router } from "express";
import { validateBusinessUuid } from "@/validations/businessValidation";

export const transitionRoutes = (): Router => {
  const routes = Router();

  routes.route("/list").get(validateListTransitions, listTransitions);
  routes.route("/summary").get(transitionSummary);
  routes.route("/business/:uuid/summary").get(validateBusinessUuid, businessTransitionSummary);
  routes
    .route("/business/:uuid")
    .get(validateBusinessUuid, validateListTransitions, listBusinessTransitions);
  routes.route("/create").post(validateCreateTransition, createTransition);
  routes.route("/create-batch").post(validateBatchCreateTransition, createTransitions);
  routes.route("/details/:uuid").get(validateTransitionUuid, getTransition);
  routes.route("/update/:uuid").patch(validateUpdateTransition, updateTransition);
  routes.route("/cancel/:uuid").patch(validateTransitionUuid, cancelTransition);

  return routes;
};

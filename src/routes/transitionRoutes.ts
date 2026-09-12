import {
  createTransition,
  deleteTransition,
  getTransition,
  listBusinessTransitions,
  listTransitions,
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
  routes.route("/delete/:uuid").delete(validateTransitionUuid, deleteTransition);

  return routes;
};

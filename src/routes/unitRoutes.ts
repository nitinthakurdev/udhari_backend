import {
  createUnit,
  deleteUnit,
  getUnit,
  listBusinessUnits,
  listUnits,
  updateUnit,
} from "@/controllers/unitController";
import { requireBusinessOrAdmin } from "@/middlewares/roleAuthorizationMiddleware";
import {
  validateCreateUnit,
  validateUnitUuid,
  validateUpdateUnit,
} from "@/validations/unitValidation";
import { Router } from "express";
import { validateBusinessUuid } from "@/validations/businessValidation";

export const unitRoutes = (): Router => {
  const routes = Router();

  routes.route("/list").get(listUnits);
  routes.route("/business/:uuid").get(validateBusinessUuid, listBusinessUnits);
  routes.route("/details/:uuid").get(validateUnitUuid, getUnit);
  routes.route("/create").post(requireBusinessOrAdmin, validateCreateUnit, createUnit);
  routes.route("/update/:uuid").patch(requireBusinessOrAdmin, validateUpdateUnit, updateUnit);
  routes.route("/delete/:uuid").delete(requireBusinessOrAdmin, validateUnitUuid, deleteUnit);

  return routes;
};

import {
  createBusiness,
  deleteBusiness,
  listBusinesses,
  searchBusinesses,
  setDefaultBusiness,
  updateBusiness,
} from "@/controllers/businessController";
import {
  validateCreateBusiness,
  validateBusinessUuid,
  validateUpdateBusiness,
} from "@/validations/businessValidation";
import { Router } from "express";

export const businessRoutes = (): Router => {
  const routes: Router = Router();

  routes.route("/list").get(listBusinesses);
  routes.route("/search").get(searchBusinesses);
  routes.route("/create").post(validateCreateBusiness, createBusiness);
  routes.route("/update/:uuid").patch(validateUpdateBusiness, updateBusiness);
  routes.route("/delete/:uuid").delete(validateBusinessUuid, deleteBusiness);
  routes.route("/set-default/:uuid").patch(validateBusinessUuid, setDefaultBusiness);

  return routes;
};

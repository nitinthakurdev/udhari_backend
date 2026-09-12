import {
  createCustomerManagement,
  deleteCustomerManagement,
  listCustomerManagement,
  listUsersConnectedToBusiness,
  updateCustomerManagement,
} from "@/controllers/customerManagementController";
import {
  validateCreateCustomerManagement,
  validateCustomerManagementUuid,
  validateUpdateCustomerManagement,
} from "@/validations/customerManagementValidation";
import { validateBusinessUuid } from "@/validations/businessValidation";
import { Router } from "express";

export const customerManagementRoutes = (): Router => {
  const routes = Router();

  routes.route("/list").get(listCustomerManagement);
  routes.route("/connected-users/:uuid").get(validateBusinessUuid, listUsersConnectedToBusiness);
  routes.route("/create").post(validateCreateCustomerManagement, createCustomerManagement);
  routes.route("/update/:uuid").patch(validateUpdateCustomerManagement, updateCustomerManagement);
  routes.route("/delete/:uuid").delete(validateCustomerManagementUuid, deleteCustomerManagement);

  return routes;
};

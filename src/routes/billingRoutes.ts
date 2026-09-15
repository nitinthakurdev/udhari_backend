import {
  getBilling,
  generateMonthlyBilling,
  listBillings,
  listBusinessBillings,
  receiveBillingPayment,
  updateBillingDueDate,
} from "@/controllers/billingController";
import {
  validateBillingList,
  validateBillingUuid,
  validateExtendBillingDueDate,
  validateGenerateBilling,
  validateRecordBillingPayment,
} from "@/validations/billingValidation";
import { Router } from "express";

export const billingRoutes = (): Router => {
  const routes = Router();
  routes.get("/list", validateBillingList, listBillings);
  routes.get("/business/:uuid", validateBillingUuid, validateBillingList, listBusinessBillings);
  routes.get("/details/:uuid", validateBillingUuid, getBilling);
  routes.post("/payments/:uuid", validateRecordBillingPayment, receiveBillingPayment);
  routes.patch("/generate/:uuid", validateGenerateBilling, generateMonthlyBilling);
  routes.patch("/due-date/:uuid", validateExtendBillingDueDate, updateBillingDueDate);
  return routes;
};

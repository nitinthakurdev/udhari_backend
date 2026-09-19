import {
  createRecurringTransactionConfig,
  deleteRecurringTransactionConfig,
  listCurrentUserRecurringTransactionConfigs,
  listRecurringTransactionConfigs,
  updateRecurringTransactionConfig,
  sendRecurringTransactionConfigNow,
} from "@/controllers/recurringTransactionConfigController";
import {
  validateCreateRecurringTransactionConfig,
  validateRecurringTransactionConfigUuid,
  validateUpdateRecurringTransactionConfig,
  validateSendRecurringTransactionConfig,
} from "@/validations/recurringTransactionConfigValidation";
import { Router } from "express";

export const recurringTransactionConfigRoutes = (): Router => {
  const routes = Router();
  routes.get("/list", listCurrentUserRecurringTransactionConfigs);
  routes.get("/business/:businessUuid", listRecurringTransactionConfigs);
  routes.post(
    "/send/:uuid",
    validateSendRecurringTransactionConfig,
    sendRecurringTransactionConfigNow,
  );
  routes.post(
    "/create",
    validateCreateRecurringTransactionConfig,
    createRecurringTransactionConfig,
  );
  routes.patch(
    "/update/:uuid",
    validateUpdateRecurringTransactionConfig,
    updateRecurringTransactionConfig,
  );
  routes.delete(
    "/delete/:uuid",
    validateRecurringTransactionConfigUuid,
    deleteRecurringTransactionConfig,
  );
  return routes;
};

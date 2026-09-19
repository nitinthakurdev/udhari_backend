import { businessModel } from "@/models/businessModel";
import { recurringTransactionConfigModel } from "@/models/recurringTransactionConfigModel";
import { unitModel } from "@/models/unitModel";
import { userModel } from "@/models/userModel";

recurringTransactionConfigModel.belongsTo(businessModel, {
  foreignKey: "business_id",
  as: "business",
});
recurringTransactionConfigModel.belongsTo(businessModel, {
  foreignKey: "customer_business_id",
  as: "customer_business",
});
recurringTransactionConfigModel.belongsTo(userModel, {
  foreignKey: "customer_id",
  as: "customer",
});
recurringTransactionConfigModel.belongsTo(userModel, {
  foreignKey: "created_by",
  as: "creator",
});
recurringTransactionConfigModel.belongsTo(unitModel, {
  foreignKey: "unit_id",
  as: "unit",
});

import { businessModel } from "@/models/businessModel";
import { customerManagementModel } from "@/models/customerManagement";
import { userModel } from "@/models/userModel";

userModel.hasMany(customerManagementModel, {
  foreignKey: "created_by",
  as: "created_customer_connections",
});
customerManagementModel.belongsTo(userModel, { foreignKey: "created_by", as: "creator" });

userModel.hasMany(customerManagementModel, {
  foreignKey: "connect_user_id",
  as: "customer_connections",
});
customerManagementModel.belongsTo(userModel, {
  foreignKey: "connect_user_id",
  as: "connected_user",
});

userModel.hasMany(customerManagementModel, {
  foreignKey: "updated_by",
  as: "updated_customer_connections",
});
customerManagementModel.belongsTo(userModel, { foreignKey: "updated_by", as: "updater" });

userModel.hasMany(customerManagementModel, {
  foreignKey: "deleted_by",
  as: "deleted_customer_connections",
});
customerManagementModel.belongsTo(userModel, { foreignKey: "deleted_by", as: "deleter" });

businessModel.hasMany(customerManagementModel, {
  foreignKey: "business_id",
  as: "customer_connections",
});
customerManagementModel.belongsTo(businessModel, { foreignKey: "business_id", as: "business" });

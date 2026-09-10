import { customerManagementModel } from "@/models/customerManagement";
import { userModel } from "@/models/userModel";

// ----------------- created user mapping -------------------
userModel.hasMany(customerManagementModel, { foreignKey: "created_by", as: "creator" });
customerManagementModel.belongsTo(userModel, { foreignKey: "created_by", as: "customers" });

// --------------- connected user mapping -----------------
userModel.hasMany(customerManagementModel, { foreignKey: "connect_user_id", as: "connected_user" });
customerManagementModel.belongsTo(userModel, {
  foreignKey: "connect_user_id",
  as: "connected_customer",
});

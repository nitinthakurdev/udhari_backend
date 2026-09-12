import { businessModel } from "@/models/businessModel";
import { transitionsModel } from "@/models/transitionModel";
import { userModel } from "@/models/userModel";
import { unitModel } from "@/models/unitModel";

userModel.hasMany(transitionsModel, { foreignKey: "user_id", as: "transitions" });
transitionsModel.belongsTo(userModel, { foreignKey: "user_id", as: "user" });

businessModel.hasMany(transitionsModel, {
  foreignKey: "business_id",
  as: "transitions",
});
transitionsModel.belongsTo(businessModel, {
  foreignKey: "business_id",
  as: "business",
});

unitModel.hasMany(transitionsModel, { foreignKey: "unit_id", as: "transitions" });
transitionsModel.belongsTo(unitModel, { foreignKey: "unit_id", as: "unit" });

userModel.hasMany(transitionsModel, {
  foreignKey: "created_by",
  as: "created_transitions",
});
transitionsModel.belongsTo(userModel, { foreignKey: "created_by", as: "creator" });

userModel.hasMany(transitionsModel, {
  foreignKey: "updated_by",
  as: "updated_transitions",
});
transitionsModel.belongsTo(userModel, { foreignKey: "updated_by", as: "updater" });

userModel.hasMany(transitionsModel, {
  foreignKey: "deleted_by",
  as: "deleted_transitions",
});
transitionsModel.belongsTo(userModel, { foreignKey: "deleted_by", as: "deleter" });

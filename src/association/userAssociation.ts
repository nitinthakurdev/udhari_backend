import { organizationModel } from "@/models/organizationModel";
import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";
import { subscriptionModel } from "@/models/subscriptionModel";

// -------------- role association -----------------
roleModel.hasMany(userModel, { foreignKey: "role_id", as: "users" });
userModel.belongsTo(roleModel, { foreignKey: "role_id", as: "user_role" });
roleModel.hasMany(subscriptionModel, { foreignKey: "role_id", as: "subscriptions" });
subscriptionModel.belongsTo(roleModel, { foreignKey: "role_id", as: "role" });

// -------------- organization association --------------
organizationModel.hasOne(userModel, { foreignKey: "organization_id", as: "owner" });
userModel.belongsTo(organizationModel, { foreignKey: "organization_id", as: "organization" });

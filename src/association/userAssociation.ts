import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";

roleModel.hasMany(userModel, { foreignKey: "role_id", as: "users" });
userModel.belongsTo(roleModel, { foreignKey: "role_id", as: "user_role" });

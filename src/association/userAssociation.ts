import { organizationModel } from "@/models/organizationModel";
import { roleModel } from "@/models/roleModel";
import { userModel } from "@/models/userModel";


// -------------- role association -----------------
roleModel.hasMany(userModel, { foreignKey: "role_id", as: "users" });
userModel.belongsTo(roleModel, { foreignKey: "role_id", as: "user_role" });


// -------------- organization association --------------
organizationModel.hasOne(userModel, { foreignKey:"organization_id",as:"owner"});
userModel.belongsTo(organizationModel, { foreignKey: "organization_id", as: "organization" })



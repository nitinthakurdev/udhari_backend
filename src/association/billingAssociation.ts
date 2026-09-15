import { billingModel } from "@/models/billingModel";
import { businessModel } from "@/models/businessModel";
import { paymentReceivedModel } from "@/models/paymentReceivedModel";
import { transitionsModel } from "@/models/transitionModel";
import { userModel } from "@/models/userModel";

userModel.hasMany(billingModel, { foreignKey: "customer_id", as: "customer_billings" });
billingModel.belongsTo(userModel, { foreignKey: "customer_id", as: "customer" });

businessModel.hasMany(billingModel, { foreignKey: "business_id", as: "billings" });
billingModel.belongsTo(businessModel, { foreignKey: "business_id", as: "business" });

userModel.hasMany(billingModel, {
  foreignKey: "business_owner_id",
  as: "owned_business_billings",
});
billingModel.belongsTo(userModel, { foreignKey: "business_owner_id", as: "business_owner" });

userModel.hasMany(billingModel, { foreignKey: "created_by", as: "created_billings" });
billingModel.belongsTo(userModel, { foreignKey: "created_by", as: "creator" });

userModel.hasMany(billingModel, { foreignKey: "updated_by", as: "updated_billings" });
billingModel.belongsTo(userModel, { foreignKey: "updated_by", as: "updater" });

billingModel.hasMany(paymentReceivedModel, {
  foreignKey: "billing_id",
  as: "payments_received",
});
paymentReceivedModel.belongsTo(billingModel, { foreignKey: "billing_id", as: "billing" });

transitionsModel.hasMany(paymentReceivedModel, {
  foreignKey: "transition_id",
  as: "payments_received",
});
paymentReceivedModel.belongsTo(transitionsModel, {
  foreignKey: "transition_id",
  as: "transition",
});

userModel.hasMany(paymentReceivedModel, {
  foreignKey: "created_by",
  as: "created_payments_received",
});
paymentReceivedModel.belongsTo(userModel, { foreignKey: "created_by", as: "creator" });

userModel.hasMany(paymentReceivedModel, {
  foreignKey: "updated_by",
  as: "updated_payments_received",
});
paymentReceivedModel.belongsTo(userModel, { foreignKey: "updated_by", as: "updater" });

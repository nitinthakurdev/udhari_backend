import { subscriptionModel } from "@/models/subscriptionModel";
import { userModel } from "@/models/userModel";
import { userSubscriptionModel } from "@/models/userSubscriptionModel";

userModel.hasMany(userSubscriptionModel, {
  foreignKey: "user_id",
  as: "user_subscriptions",
});
userSubscriptionModel.belongsTo(userModel, { foreignKey: "user_id", as: "user" });

subscriptionModel.hasMany(userSubscriptionModel, {
  foreignKey: "subscription_id",
  as: "user_subscriptions",
});
userSubscriptionModel.belongsTo(subscriptionModel, {
  foreignKey: "subscription_id",
  as: "subscription",
});

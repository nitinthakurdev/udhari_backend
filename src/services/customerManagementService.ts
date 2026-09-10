import { customerManagementModel } from "@/models/customerManagement";
import { userModel } from "@/models/userModel";
import type {
  ICustomerManagementPayload,
  ICustomerManagementSchema,
} from "@/types/customerManagementTypes";
import { Op } from "sequelize";

// ---------------- here the join related this table -------------

const includesHandle = {
  creator: {
    model: userModel,
    as: "customers",
  },
};

/*
==============================================================================
****************** create customer management service ******************
==============================================================================
 */
export const createCustomerManagement = async (
  data: ICustomerManagementPayload,
): Promise<ICustomerManagementSchema> => {
  const result = await customerManagementModel.create(data);
  return result.dataValues;
};

/*
==============================================================================
****************** already created or not ******************
==============================================================================
 */
export const checkTheCustomerAlreadyAdded = async (
  connect_user_id: number,
  business_id: number,
): Promise<ICustomerManagementSchema | undefined> => {
  const result = await customerManagementModel.findOne({
    where: {
      [Op.or]: [
        { connect_user_id, business_id },
        { connect_user_id: business_id, business_id: connect_user_id },
      ],
    },
  });
  return result?.dataValues;
};

/*
==============================================================================
****************** delete user management ******************
==============================================================================
 */
export const deleteUserManagementRecord = async (uuid: string) => {
  const result = await customerManagementModel.destroy({ where: { uuid } });
  return result;
};

/*
==============================================================================
****************** get user management ******************
==============================================================================
 */

export const getConnectedUser = async (user_id: number, role: string) => {
  const result = await customerManagementModel.findAll({
    where: {
      [Op.or]: [{ created_by: user_id }, { connect_user_id: user_id }],
      role: role,
    },
    include: [includesHandle.creator],
  });
  return result;
};

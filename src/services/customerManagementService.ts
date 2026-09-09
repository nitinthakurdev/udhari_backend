import { customerManagementModel } from "@/models/customerManagement";
import type { ICustomerManagementPayload, ICustomerManagementSchema } from "@/types/customerManagementTypes";
import { Op } from "sequelize";



/*
==============================================================================
****************** create customer management service ******************
==============================================================================
 */
export const createCustomerManagement = async (data: ICustomerManagementPayload): Promise<ICustomerManagementSchema> => {
    const result = await customerManagementModel.create(data);
    return result.dataValues
};

/*
==============================================================================
****************** already created or not ******************
==============================================================================
 */
export const checkTheCustomerAlreadyAdded = async (connect_user_id: number, organization_id: number): Promise<ICustomerManagementSchema | undefined> => {
    const result = await customerManagementModel.findOne({
        where: {
            [Op.or]: [
                { connect_user_id, organization_id },
                { connect_user_id: organization_id, organization_id: connect_user_id }
            ],
        }
    });
    return result?.dataValues
};


/*
==============================================================================
****************** delete user management ******************
==============================================================================
 */
export const deleteUserManagementRecord = async (uuid:string) => {
    const result = await customerManagementModel.destroy({where:{uuid}});
    return result
};
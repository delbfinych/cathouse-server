import sequelize from '../db';
import { Roles } from '../roles';

export const getRole = async (id: number) =>
    (
        await sequelize.query(
            `SELECT role_id as role FROM "UserRoles" WHERE user_id = ${id}`
        )
    )[0][0] as {
        role: Roles;
    };

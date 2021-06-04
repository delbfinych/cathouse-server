import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    role_id: number;
    user_id: number;
}

// interface UserCreationAttributes extends Optional<UserAttributes, "role_id"> {}

interface Instance extends Model<Attributes>, Attributes {}

export const UserRoles = sequelize.define<Instance>('UserRoles', {
    user_id: {
        type: DataTypes.INTEGER,
    },
    role_id: {
        type: DataTypes.INTEGER,
    },
});

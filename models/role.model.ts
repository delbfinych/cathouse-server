import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    role_id: number;
    role_name: string;
}

interface Instance extends Model<Attributes>, Attributes {}

export const Roles = sequelize.define<Instance>('Roles', {
    role_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    role_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

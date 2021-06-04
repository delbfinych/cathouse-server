import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    filename: string;
    user_id: number;
}

interface Instance extends Model<Attributes>, Attributes {}

export const File = sequelize.define<Instance>('File', {
    filename: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    user_id: number;
    id: string;
}

interface Instance extends Model<Attributes>, Attributes {}

export const Media = sequelize.define<Instance>('Media', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id: {
        type: DataTypes.STRING,
        autoIncrement: true,
        primaryKey: true,
    },
});

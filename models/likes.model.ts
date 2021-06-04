import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    id?: number;
    user_id: number;
    post_id: number;
    liked: number;
}

interface Instance extends Model<Attributes>, Attributes {}

export const Likes = sequelize.define<Instance>('Likes', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    liked: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

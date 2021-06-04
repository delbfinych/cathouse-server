import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    post_id: number;
    user_id: number;
    path: string;
}

interface Instance extends Model<Attributes>, Attributes {}

export const PostAttachment = sequelize.define<Instance>('PostAttachment', {
    post_id: {
        type: DataTypes.INTEGER,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

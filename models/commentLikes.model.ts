import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    user_id: number;
    comment_id: number;
    liked: number;
}

interface Instance extends Model<Attributes>, Attributes {}

export const CommentLikes = sequelize.define<Instance>('CommentLikes', {
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    comment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    liked: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

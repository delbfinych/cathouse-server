import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    comment_id: number;
    post_id: number;
    author_id: number;
    url: string;
}

interface Instance extends Model<Attributes>, Attributes {}

export const ProfileImages = sequelize.define<Instance>('ProfileImages', {
    comment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

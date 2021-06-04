import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    follower_id: number;
    following_id: number;
}

interface Instance extends Model<Attributes>, Attributes {}

export const Followers = sequelize.define<Instance>('Followers', {
    follower_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    following_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

export const FollowerUser = sequelize.define('FollowerUser', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
});

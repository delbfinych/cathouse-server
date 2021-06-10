import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    comment_id: number;
    post_id: number;
    body: string;
    author_id: number;
}

interface OptionalAttributes extends Optional<Attributes, 'comment_id'> {}

interface Instance extends Model<Attributes, OptionalAttributes>, Attributes {}

export const Comments = sequelize.define<Instance>('Comments', {
    comment_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

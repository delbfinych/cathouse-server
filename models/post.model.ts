import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';

interface Attributes {
    post_id: number;
    author_id: number;
    body: string;
}
interface OptionalAttributes extends Optional<Attributes, "post_id"> {}

interface Instance extends Model<Attributes, OptionalAttributes>, Attributes {}

export const Posts = sequelize.define<Instance>('Posts', {
    post_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    body: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
});

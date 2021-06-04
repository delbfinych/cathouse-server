import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
config();

export default new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: 'postgres',
        host: process.env.DATABASE_URL,
        port: parseInt(process.env.DB_PORT),
    }
);

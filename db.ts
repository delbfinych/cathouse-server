import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
config();

export default new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: true,
        rejectUnauthorized: true,
    },
});

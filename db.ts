import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
config();

export default new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
        },
    },
});

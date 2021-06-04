import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
config();
console.log(process.env.DATABASE_URL);

export default new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: true,
        rejectUnauthorized: true,
    },
});

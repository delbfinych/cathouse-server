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

// export default new Sequelize('test', 'postgres', 'root', {
//     dialect: 'postgres',
//     host: 'localhost',
//     port: 5432,
// });

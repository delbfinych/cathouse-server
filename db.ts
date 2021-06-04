import { Sequelize } from 'sequelize';
import { config } from 'dotenv';
config();

export default new Sequelize(
    'd3m1mhi25vbl0c',
    'pfgvuixpkgobkz',
    '73d57b72c7263a375007d1f839086b5a4b245c272efa1876844ea21bb66f22e3',
    {
        host: 'ec2-3-89-0-52.compute-1.amazonaws.com',
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
        },
    }
);

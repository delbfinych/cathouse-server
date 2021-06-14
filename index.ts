import { upload } from './multer';
import express from 'express';
import { config } from 'dotenv';
import sequelize from './db';
import cors from 'cors';
import router from './routes';
import { handleError } from './error/errorHandler';
import path from 'path';
config();
import swaggerUi from 'swagger-ui-express/';
import swaggerDocument from './swagger.json';
import authController from './controllers/auth.controller';
import { Roles } from './roles';
import mediaController from './controllers/media.controller';
import cookieParser from 'cookie-parser';

const PORT = process.env.PORT;
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: true }));

app.use(express.json());
// app.use('/media', express.static(path.resolve(__dirname, 'static')));

app.use('/api', router);
app.use(handleError);

(async () => {
    try {
        sequelize.authenticate();
        sequelize.sync();
        app.listen(PORT, () => {});
    } catch (error) {
        console.log('ERROR: ', error);
    }
})();

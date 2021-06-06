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
import fileController from './controllers/file.controller';

const PORT = process.env.PORT;
const app = express();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());
app.use(express.json());
// app.use('/media', express.static(path.resolve(__dirname, 'static')));
app.post(
    '/media/',
    authController.checkAuth('required'),
    authController.checkRole([Roles.ADMIN]),
    upload.fields([{ name: 'avatar_url', maxCount: 1 }]),
    fileController.uploadToRemoteServer,
    async (req, res) => {
        //@ts-ignore
        const filename = req.files.avatar_url[0].filename;
        return res.json({ url: filename });
    }
);
app.use('/media', (req, res) => {
    res.redirect(
        'https://raw.githubusercontent.com/delbfinych/heroku-files/master' +
            req.url
    );
});

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

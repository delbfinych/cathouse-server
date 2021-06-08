import { Router } from 'express';
import fileController from '../controllers/file.controller';
import { upload } from '../multer';
const router = Router();

router
    .get('/:path', (req, res) => {
        res.redirect(
            'https://raw.githubusercontent.com/delbfinych/heroku-files/master' +
                req.url
        );
    })
    .post(
        '/',
        upload.fields([{ name: 'image', maxCount: 10 }]),
        fileController.uploadToRemoteServer,
        (req, res) => {
            //@ts-ignore
            return res.json([...req.files.map((file) => file.filename)]);
        }
    );

export default router;

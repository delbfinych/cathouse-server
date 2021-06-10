import { Router } from 'express';
import authController from '../controllers/auth.controller';
import mediaController from '../controllers/media.controller';
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
        mediaController.uploadToRemoteServer,
        (req, res) => {
            //@ts-ignore
            return res.json([...req.files.map((file) => file.filename)]);
        }
    )
    .post('/attach', authController.checkAuth(), mediaController.attachImage);

export default router;

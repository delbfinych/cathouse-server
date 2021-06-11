import { Router } from 'express';
import authController from '../controllers/auth.controller';
import mediaController from '../controllers/media.controller';
import { upload } from '../multer';
import fetch from 'node-fetch';
const router = Router();

router
    .get('/:path', async (req, res) => {
        const response = await fetch(process.env.IMAGE_REMOTE_URL + req.url);
        res.set({ 'content-type': response.headers.get('content-type') });
        res.send(await response.buffer());
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

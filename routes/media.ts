import { Router } from 'express';
import authController from '../controllers/auth.controller';
import mediaController from '../controllers/media.controller';
import { upload } from '../multer';
import fetch from 'node-fetch';
const router = Router();

const permitted = ['http://localhost:3000/', 'https://cathouse.vercel.app/'];
router
    .get('/:path', async (req, res) => {
        const imgLink = await (
            await fetch(
                `${process.env.REMOTE_SERVER_URL}/get?filename=${req.url}`
            )
        ).text();

        const response = await fetch(imgLink);
        if (!permitted.includes(req.headers.referer)) {
            res.sendStatus(403);
        } else {
            res.set({ 'content-type': response.headers.get('content-type') });
            res.send(await response.buffer());
        }
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

import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import commentCtrl from '../controllers/comment.controller';
import { upload } from '../multer';

const router = Router();

router
    .get('/:id', commentCtrl.get)
    .post('/:id', authCtrl.checkAuth('required'), commentCtrl.update)
    .delete('/:id', authCtrl.checkAuth('required'), commentCtrl.delete)
    .post('/:id/like', authCtrl.checkAuth('required'), commentCtrl.like)
    .post('/:id/dislike', authCtrl.checkAuth('required'), commentCtrl.dislike)
    .post(
        '/:id/media',
        authCtrl.checkAuth('required'),
        upload.array('files'),
        commentCtrl.attachFiles
    )
    .delete('/:id/media', authCtrl.checkAuth(), commentCtrl.detachFiles);

export default router;

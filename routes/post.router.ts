import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import postCtrl from '../controllers/post.controller';
import { upload } from '../multer';

const router = Router();

router
    .post('/', authCtrl.checkAuth('required'), postCtrl.create)
    .get('/:id', authCtrl.checkAuth(), postCtrl.get)
    .post('/:id', authCtrl.checkAuth('required'), postCtrl.update)
    .delete('/:id', authCtrl.checkAuth('required'), postCtrl.delete)
    .post('/:id/like', authCtrl.checkAuth('required'), postCtrl.like)
    .post('/:id/dislike', authCtrl.checkAuth('required'), postCtrl.dislike)
    .get('/:id/comments', postCtrl.getCommentsByPostId)
    .post('/:id/comments', authCtrl.checkAuth('required'), postCtrl.addComment)
    .post(
        '/:id/media',
        authCtrl.checkAuth('required'),
        upload.array('files'),
        postCtrl.attachFiles
    )
    .delete('/:id/media', authCtrl.checkAuth('required'), postCtrl.detachFiles);

export default router;

import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import postCtrl from '../controllers/post.controller';
import { upload } from '../multer';

const router = Router();

router
    .post('/', authCtrl.checkAuth(), postCtrl.create)
    .get('/:id', authCtrl.checkAuth(), postCtrl.get)
    .post('/:id', authCtrl.checkAuth(), postCtrl.update)
    .delete('/:id', authCtrl.checkAuth(), postCtrl.delete)
    .post('/:id/like', authCtrl.checkAuth(), postCtrl.like)
    .post('/:id/dislike', authCtrl.checkAuth(), postCtrl.dislike)
    .get('/:id/comments', authCtrl.checkAuth(), postCtrl.getCommentsByPostId)
    .post('/:id/comments', authCtrl.checkAuth(), postCtrl.addComment)
    // .post(
    //     '/:id/media',
    //     authCtrl.checkAuth('required'),
    //     upload.array('files'),
    //     postCtrl.attachFiles
    // )
    .delete('/:id/media', authCtrl.checkAuth(), postCtrl.detachFiles);

export default router;

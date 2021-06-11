import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import commentCtrl from '../controllers/comment.controller';
import { upload } from '../multer';

const router = Router();

router
    .get('/:id', commentCtrl.get)
    .post('/:id', authCtrl.checkAuth(), commentCtrl.update)
    .delete('/:id', authCtrl.checkAuth(), commentCtrl.delete)
    .post('/:id/like', authCtrl.checkAuth(), commentCtrl.like)
    .post('/:id/dislike', authCtrl.checkAuth(), commentCtrl.dislike);

export default router;

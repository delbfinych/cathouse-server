import { Roles } from './../roles';
import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import userCtrl from '../controllers/user.controller';
import { upload } from '../multer';

const router = Router();

router
    .get('/', userCtrl.index)
    .get('/search', userCtrl.search)
    .get('/:id', authCtrl.checkAuth(), userCtrl.get)
    .get('/:id/followers', authCtrl.checkAuth(), userCtrl.getFollowersById)
    .get('/:id/following', authCtrl.checkAuth(), userCtrl.getFollowingById)
    .post(
        '/:id',
        authCtrl.checkAuth('required'),
        upload.single('avatar_url'),
        userCtrl.update
    )
    .post('/:id/follow/', authCtrl.checkAuth('required'), userCtrl.follow)
    .post('/:id/unfollow', authCtrl.checkAuth('required'), userCtrl.unfollow)
    .post(
        '/:id/giveRole',
        authCtrl.checkAuth('required'),
        authCtrl.checkRole([Roles.ADMIN]),
        userCtrl.giveRole
    )
    .get('/:id/posts', authCtrl.checkAuth(), userCtrl.getPostsByUserId)
    .get(
        '/:id/posts/following',
        authCtrl.checkAuth(),
        userCtrl.getFollowingPostsByUserId
    )
    .get('/:id/comments', userCtrl.getCommentsByUserId);

export default router;

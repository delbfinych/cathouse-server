import { Roles } from '../roles';
import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import userCtrl from '../controllers/user.controller';

const router = Router();

router
    .get('/', authCtrl.checkAuth(), userCtrl.index)
    .get('/search', userCtrl.search)
    .get('/:id', authCtrl.checkAuth(), userCtrl.get)
    .get(
        '/:id/images',
        authCtrl.checkAuth(),
        userCtrl.checkAccess(),
        userCtrl.getImages
    )
    .get('/:id/followers', authCtrl.checkAuth(), userCtrl.getFollowersById)
    .get('/:id/following', authCtrl.checkAuth(), userCtrl.getFollowingById)
    .post('/:id', authCtrl.checkAuth(), userCtrl.update)
    .post('/:id/follow/', authCtrl.checkAuth(), userCtrl.follow)
    .post('/:id/unfollow', authCtrl.checkAuth(), userCtrl.unfollow)
    .post(
        '/:id/giveRole',
        authCtrl.checkAuth(),
        authCtrl.checkRole([Roles.ADMIN]),
        userCtrl.giveRole
    )
    .get(
        '/:id/posts',
        authCtrl.checkAuth(),
        userCtrl.checkAccess(),
        userCtrl.getPostsByUserId
    )
    .get(
        '/:id/posts/following',
        authCtrl.checkAuth(),
        userCtrl.getFollowingPostsByUserId
    )
    .get(
        '/:id/comments',
        authCtrl.checkAuth(),
        userCtrl.checkAccess(),
        userCtrl.getCommentsByUserId
    );

export default router;

import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import { upload } from '../multer';

const router = Router();

router
    .post(
        '/signup',
        authCtrl.signUp
    )
    .post('/signin', authCtrl.signIn)
    .get('/signout', authCtrl.checkAuth(), authCtrl.signOut)
    .get('/verifyUserName', authCtrl.verifyUserName)
    .get('/verifyToken', authCtrl.checkAuth(), authCtrl.verifyToken);

export default router;

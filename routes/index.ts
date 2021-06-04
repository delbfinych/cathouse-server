import { Router } from 'express';
const router = Router();

import authRouter from './auth.router';
import userRouter from './user.router';
import postRouter from './post.router';
import commentRouter from './comment.router';

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/post', postRouter);
router.use('/comment', commentRouter);

export default router;

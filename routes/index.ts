import { Router } from 'express';
const router = Router();

import authRouter from './auth';
import userRouter from './user';
import postRouter from './post';
import commentRouter from './comment';
import mediaRouter from './media';

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/post', postRouter);
router.use('/comment', commentRouter);
router.use('/media', mediaRouter);
export default router;

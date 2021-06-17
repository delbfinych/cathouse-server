import { CustomError } from './../error/CustomError';
import { Router } from 'express';
import authCtrl from '../controllers/auth.controller';
import sequelize from '../db';
import {
    IPaginationInfo,
    IPaginationResponse,
    IUserCard,
    IUserWithFollowInfo,
} from '../controllers/interfaces';

const router = Router();

interface ILikesStatReq {
    type: 'post' | 'comment';
    id: number;
    liked: boolean;
    page: number;
}
router.post('/', authCtrl.checkAuth(), async (req, res, next) => {
    try {
        const { id, type, liked, page } = req.body as ILikesStatReq;
        const condition = liked ? 1 : 0;
        const table = type == 'comment' ? '"CommentLikes"' : '"Likes"';
        const limit = 10;
        const idStr = (type == 'comment' ? 'comment_id' : 'post_id') + '=' + id;
        const users = (
            await sequelize.query(`
            SELECT id, first_name, last_name, avatar_url FROM "Users"
            JOIN (SELECT post_id, 
                liked, 
                user_id 
                FROM ${table} where ${idStr} and liked = ${condition}) likes 
                ON likes.user_id = "Users".id
                LIMIT ${limit} OFFSET ${limit * (page - 1)} 

        `)
        )[0] as IUserCard[];

        const details = (
            await sequelize.query(`
        SELECT CAST(COUNT(*) AS INTEGER) total_count, 
               CEILING (CAST(COUNT(*) AS FLOAT) / ${limit}) total_pages 
        FROM ${table} WHERE ${idStr} and liked = ${condition} 
        `)
        )[0][0] as IPaginationInfo;

        const response: IPaginationResponse<IUserCard> = {
            page: page,
            result: users,
            total_count: details.total_count,
            total_pages: details.total_pages,
        };
        res.json(response);
    } catch (error) {
        next(CustomError.internal(error.message));
    }
});

export default router;

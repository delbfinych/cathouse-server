import { Roles } from './../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { Post } from '../models/models';
import { config } from 'dotenv';
config();

class FileController {
    async create(req, res, next) {
        try {
            const { id } = req.user;
            const { content } = req.body;
            if (!content) {
                return next(CustomError.badRequest('Post content is empty'));
            }
            const post = await Post.create({ author_id: id, body: content });
            // TODO: likes/deslikes count ?
            res.json(post);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
}

export default new FileController();

import { Roles } from './../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { CommentLikes, Comment, CommentAttachment } from '../models/models';
import { IComment } from './interfaces';

enum Like {
    LIKE = 1,
    DISLIKE = 0,
}



const getComment = async (comment_id): Promise<IComment | null> => {
    const comment: IComment = (
        await sequelize.query(
            `select "Comments".*, CAST(coalesce(b.likes, 0) as INTEGER) as likes_count, CAST(coalesce((b.total - b.likes), 0) as INTEGER) as dislikes_count from "Comments"
            left join (select comment_id, count(*) as total, SUM(liked) as likes from "CommentLikes" group by comment_id) 
            as b on "Comments".comment_id = b.comment_id
            where "Comments".comment_id = ${comment_id}`
        )
    )[0][0];
    if (!comment) {
        return null;
    }
    comment.attachments = await CommentAttachment.findAll({
        where: { comment_id },
        attributes: ['path', 'createdAt'],
    });
    return comment;
};
class CommentController {
    async get(req, res, next) {
        try {
            const { id } = req.params;
            const comment = await getComment(id);
            if (!comment) {
                return next(CustomError.notFound('Comment was not found'));
            }
            res.json(comment);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const options = {
                comment_id: id,
            };
            if (req.user.role === Roles.USER) {
                options['author_id'] = userId;
            }
            const comment = await Comment.destroy({
                where: options,
            });
            if (!comment) {
                return next(CustomError.forbidden('Could not delete comment'));
            } else {
                res.json({ status: 'ok' });
            }
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const userId = req.user.id;

            const comment = await getComment(id);
            if (!comment || comment.author_id !== userId || !message) {
                return next(CustomError.forbidden('Could not update comment'));
            }
            await sequelize.query(
                `UPDATE "Comments" SET body='${message}'
                         where comment_id = ${id}`
            );
            comment.body = message;
            res.json(comment);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async like(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const comment = await Comment.findOne({
                where: { comment_id: id },
            });
            if (!comment) {
                next(CustomError.notFound('Comment was not found'));
            }

            const like = await CommentLikes.findOne({
                where: { user_id: userId, comment_id: id },
            });

            if (!like) {
                await CommentLikes.create({
                    liked: Like.LIKE,
                    comment_id: id,
                    user_id: userId,
                });
            } else if (like.liked == Like.DISLIKE) {
                await sequelize.query(
                    `UPDATE "CommentLikes" SET liked=${Like.LIKE}
                     WHERE user_id = ${userId} and comment_id = ${id}`
                );
            } else if (like.liked == Like.LIKE) {
                await CommentLikes.destroy({
                    where: { user_id: userId, comment_id: id },
                });
            }

            res.json({ status: 'ok' });
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async dislike(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const comment = await Comment.findOne({
                where: { comment_id: id },
            });
            if (!comment) {
                next(CustomError.notFound('Comment was not found'));
            }

            const dislike = await CommentLikes.findOne({
                where: { user_id: userId, comment_id: id },
            });
            if (!dislike) {
                await CommentLikes.create({
                    liked: Like.DISLIKE,
                    comment_id: id,
                    user_id: userId,
                });
            } else if (dislike.liked == Like.LIKE) {
                await sequelize.query(
                    `UPDATE "CommentLikes" SET liked=${Like.DISLIKE}
                     WHERE user_id = ${userId} and comment_id = ${id}`
                );
            } else if (dislike.liked == Like.DISLIKE) {
                await CommentLikes.destroy({
                    where: { user_id: userId, comment_id: id },
                });
            }
            res.json({ status: 'ok' });
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async attachFiles(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const comment = await Comment.findOne({
                where: { comment_id: id, author_id: userId },
            });
            if (!comment) {
                return next(CustomError.forbidden('Could not attach file'));
            }
            for (let file of req.files) {
                await CommentAttachment.create({
                    path: file.filename,
                    user_id: userId,
                    comment_id: id,
                });
            }
            res.json({ paths: req.files.map((path) => path.filename) });
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async detachFiles(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const filenames = req.body.filenames;
            const comment = await Comment.findOne({
                where: { comment_id: id, author_id: userId },
            });
            if (!comment) {
                return next(CustomError.forbidden('Could not detach file'));
            }
            for (let file of filenames) {
                await CommentAttachment.destroy({
                    where: { comment_id: id, path: file },
                });
            }
            res.json({ status: 'ok' });
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
}

export default new CommentController();

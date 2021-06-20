import { Roles } from './../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { CommentLikes, Comment } from '../models/models';
import { getRole, getCommentAttachments, getComment } from './someQueries';
import { IPost } from './interfaces';

enum Like {
    LIKE = 1,
    DISLIKE = 0,
}

class CommentController {
    async get(req, res, next) {
        try {
            const { id } = req.params;
            const comment = await getComment(id, req?.user?.id ?? null);
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

            const role = await getRole(req.user.id);
            if (role.role === Roles.USER) {
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

            const comment = await getComment(id, userId);
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
    checkAccess = () => async (req, res, next) => {
        const userId = req.user.id;
        const commentId = req.params.id;

        if (userId == req.user.id) {
            return next();
        }
        const post = (
            await sequelize.query(
                `SELECT * FROM "Posts" 
             JOIN (SELECT post_id
                FROM "Comments" 
                WHERE comment_id = ${commentId}) comments 
                ON comments.post_id = "Posts".post_id`
            )
        )[0][0] as IPost;
        const privateStatus = (
            await sequelize.query(
                `SELECT private FROM "Users"
                JOIN (SELECT author_id
                      FROM "Posts"
                      WHERE post_id = ${post.post_id}) posts
                     ON posts.author_id = "Users".id`
            )
        )[0][0];

        //@ts-ignore
        if (privateStatus.private) {
            const isPermitted = (
                await sequelize.query(
                    `SELECT * FROM "Followers"
                    JOIN (SELECT author_id 
                        FROM "Posts" 
                        WHERE post_id = ${post.post_id}) author 
                        ON author.author_id = "Followers".follower_id 
                        AND 
                        "Followers".following_id = ${userId}
                    `
                )
            )[0][0];
            if (!isPermitted) {
                return next(CustomError.forbidden('Permission denied'));
            }
        }
        next();
    };
}

export default new CommentController();

import { Roles } from './../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { Post, Likes, Comment } from '../models/models';
import { config } from 'dotenv';
import {
    IPaginationInfo,
    IPaginationResponse,
    IPost,
    IComment,
} from './interfaces';
import {
    getRole,
    getPostAttachments,
    getCommentAttachments,
    getPost,
    getComment,
} from './someQueries';

config();

enum Like {
    LIKE = 1,
    DISLIKE = 0,
}

const LIMIT = 10;

class PostController {
    async get(req, res, next) {
        try {
            const { id } = req.params;
            const post: IPost = await getPost(id, req?.user?.id ?? null);
            if (!post) {
                return next(CustomError.notFound('Post was not found'));
            }
            res.json(post);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async create(req, res, next) {
        try {
            const { id } = req.user;
            const { message } = req.body;
            if (!message) {
                return next(CustomError.badRequest('Post message is empty'));
            }
            const post = await Post.create({ author_id: id, body: message });
            res.json(await getPost(post.post_id, null));
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const options = {
                post_id: id,
            };

            const role = await getRole(req.user.id);
            if (role.role === Roles.USER) {
                options['author_id'] = userId;
            }
            const post = await Post.destroy({
                where: options,
            });

            if (!post) {
                return next(CustomError.forbidden('Permission denied'));
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

            const post = await getPost(id, userId);
            if (!post || post.author_id !== userId || !message) {
                return next(CustomError.forbidden('Permission denied'));
            }
            await sequelize.query(
                `UPDATE "Posts" SET body='${message}'
                         where post_id = ${id}`
            );
            post.body = message;
            res.json(post);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async like(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const post = await Post.findOne({ where: { post_id: id } });
            if (!post) {
                next(CustomError.notFound('Post was not found'));
            }

            const like = await Likes.findOne({
                where: { user_id: userId, post_id: id },
            });

            if (!like) {
                const p = await Likes.create({
                    liked: Like.LIKE,
                    post_id: id,
                    user_id: userId,
                });
                console.log(p);
            } else if (like.liked == Like.DISLIKE) {
                await sequelize.query(
                    `UPDATE "Likes" SET liked=${Like.LIKE}
                     WHERE user_id = ${userId} and post_id = ${id}`
                );
            } else if (like.liked == Like.LIKE) {
                await Likes.destroy({
                    where: { user_id: userId, post_id: id },
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
            const post = await Post.findOne({ where: { post_id: id } });
            if (!post) {
                next(CustomError.notFound('Post was not found'));
            }

            const dislike = await Likes.findOne({
                where: { user_id: userId, post_id: id },
            });
            if (!dislike) {
                await Likes.create({
                    liked: Like.DISLIKE,
                    post_id: id,
                    user_id: userId,
                });
            } else if (dislike.liked == Like.LIKE) {
                await sequelize.query(
                    `UPDATE "Likes" SET liked=${Like.DISLIKE}
                     WHERE user_id = ${userId} and post_id = ${id}`
                );
            } else if (dislike.liked == Like.DISLIKE) {
                await Likes.destroy({
                    where: { user_id: userId, post_id: id },
                });
            }
            res.json({ status: 'ok' });
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async getCommentsByPostId(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1 } = req.query;
            const comments = (
                await sequelize.query(`
            SELECT "Comments".*, 
                    CAST(COALESCE(b.likes, 0) AS INTEGER) AS likes_count, 
                    CAST(COALESCE((b.total - b.likes), 0) AS INTEGER) AS dislikes_count,
                    likesTable.liked liked_by_me,
                    "Users".first_name as author_first_name,
                    "Users".last_name as author_last_name,
                    "Users".avatar_url as author_avatar_url
            FROM "Comments"
            LEFT JOIN (SELECT comment_id, 
                              COUNT(*) AS total, 
                              SUM(liked) AS likes 
                       FROM "CommentLikes" GROUP BY comment_id
                       ) 
            AS b ON "Comments".comment_id = b.comment_id
            

            JOIN "Users" on "Users".id = "Comments".author_id

            LEFT JOIN (SELECT liked, comment_id FROM "CommentLikes" where user_id = ${
                req?.user?.id ?? null
            }) 
            AS likesTable ON "Comments".comment_id = likesTable.comment_id 

            WHERE "Comments".post_id = ${id}
            ORDER BY "Comments".comment_id ASC LIMIT ${LIMIT} OFFSET ${
                    LIMIT * (page - 1)
                }`)
            )[0] as IComment[];
            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Comments" WHERE post_id = ${id} 
            `)
            )[0][0] as IPaginationInfo;
            const response: IPaginationResponse<IComment> = {
                page: parseInt(page),
                result: await Promise.all(
                    comments.map(async (comment) => {
                        comment.attachments = await getCommentAttachments(
                            comment.comment_id
                        );
                        return comment;
                    })
                ),
                total_count: details.total_count,
                total_pages: details.total_pages,
            };
            res.json(response);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async addComment(req, res, next) {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const post = await Post.findOne({ where: { post_id: id } });
            if (!post) {
                return next(CustomError.notFound('Post was '));
            }
            if (!message) {
                return next(CustomError.badRequest('Comment message is empty'));
            }
            const comment = await Comment.create({
                author_id: req.user.id,
                body: message,
                post_id: id,
            });
            res.json(await getComment(comment.comment_id, null));
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    checkAccess = () => async (req, res, next) => {
        const userId = req.user.id;
        const postId = req.params.id;

        const privateStatus = (
            await sequelize.query(
                `SELECT private FROM "Users" 
                JOIN (SELECT author_id
                    FROM "Posts" 
                    WHERE post_id = ${postId}) posts 
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
                        WHERE post_id = ${postId}) author 
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

export default new PostController();

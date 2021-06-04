import { Roles } from './../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { Post, Likes, Comment, PostAttachment } from '../models/models';
import { config } from 'dotenv';
import {
    IPaginationInfo,
    IPaginationResponse,
    IPost,
    IComment,
} from './interfaces';

config();

enum Like {
    LIKE = 1,
    DISLIKE = 0,
}

const getPost = async (post_id, user_id): Promise<IPost | null> => {
    const post = (
        await sequelize.query(`
            SELECT "Posts".*, 
                    CAST(COALESCE(b.likes, 0) AS INTEGER) likes_count, 
                    CAST(COALESCE((b.total - b.likes), 0) AS INTEGER) dislikes_count,
                    likesTable.liked liked_by_me,
                    CAST(COALESCE(comments.count, 0) AS INTEGER) comments_count
            FROM "Posts"

            LEFT JOIN  (SELECT post_id, 
                    COUNT(*) total, 
                    SUM(liked) likes 
                  FROM "Likes" GROUP BY post_id) 
            AS b ON "Posts".post_id = b.post_id

            LEFT JOIN (SELECT liked, post_id FROM "Likes" where user_id = ${user_id}) 
            AS likesTable ON likesTable.post_id = "Posts".post_id

            LEFT JOIN (SELECT COUNT(*), 
                       post_id FROM "Comments"
                       GROUP BY post_id) comments
            ON comments.post_id = "Posts".post_id

            WHERE "Posts".post_id = ${post_id}`)
    )[0][0] as IPost;
    if (!post) {
        return null;
    }
    // post.attachments = await PostAttachment.findAll({
    //     where: { post_id },
    //     attributes: ['path', 'createdAt'],
    // });

    return post;
};
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
            if (req.user.role === Roles.USER) {
                options['author_id'] = userId;
            }
            const post = await Post.destroy({
                where: options,
            });
            if (!post) {
                return next(CustomError.forbidden('Could not delete post'));
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
                return next(CustomError.forbidden('Could not update post'));
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
            const { page } = req.query;
            const limit = 10;
            const comments = (
                await sequelize.query(`
            SELECT "Comments".*, CAST(COALESCE(b.likes, 0) AS INTEGER) AS likes_count, 
                                 CAST(COALESCE((b.total - b.likes), 0) AS INTEGER) AS dislikes_count 
            FROM "Comments"
            LEFT JOIN (SELECT comment_id, 
                              COUNT(*) AS total, 
                              SUM(liked) AS likes 
                       FROM "CommentLikes" GROUP BY comment_id
                       ) 
            AS b ON "Comments".comment_id = b.comment_id
            WHERE "Comments".post_id = ${id}
            ORDER BY "Comments".comment_id LIMIT ${limit} OFFSET ${
                    limit * (page - 1)
                }`)
            )[0] as IComment[];
            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${limit}) total_pages 
            FROM "Comments" WHERE post_id = ${id} 
            `)
            )[0][0] as IPaginationInfo;
            const response: IPaginationResponse<IComment> = {
                page: parseInt(page),
                result: comments,
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
            res.json({
                //@ts-ignore
                ...comment.dataValues,
                likes_count: 0,
                dislikes_count: 0,
            });
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async attachFiles(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const post = await Post.findOne({
                where: { post_id: id, author_id: userId },
            });
            if (!post) {
                return next(CustomError.forbidden('Could not attach file'));
            }
            for (let file of req.files) {
                await PostAttachment.create({
                    path: file.filename,
                    user_id: userId,
                    post_id: id,
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
            const post = await Post.findOne({
                where: { post_id: id, author_id: userId },
            });
            if (!post) {
                return next(CustomError.forbidden('Could not detach file'));
            }
            for (let file of filenames) {
                await PostAttachment.destroy({
                    where: { post_id: id, path: file },
                });
            }
            res.json({ status: 'ok' });
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
}

export default new PostController();

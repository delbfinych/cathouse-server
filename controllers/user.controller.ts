import { getPostAttachments } from './someQueries';
import { Followers } from '../models/follower.model';
import { CustomError } from '../error/CustomError';
import { User, Post, Comment, Role, UserRole } from '../models/models';
import sequelize from '../db';
import { config } from 'dotenv';
import {
    IPaginationInfo,
    IPaginationResponse,
    IUser,
    IPost,
    AuthRequest,
    UserInfo,
    ISimpleUser,
} from './interfaces';
config();

const LIMIT = 10;
class UsersController {
    async index(req, res, next) {
        try {
            const { page = 1 } = req.query;
            let users = (
                await sequelize.query(` 
                SELECT  "Users".*, 
                        CAST(COALESCE(qq.followers_count, 0) AS INTEGER) AS followers_count,
                        CAST(COALESCE(b.following_count, 0) AS INTEGER) AS following_count,
                        t.following_id followed_by_me,
                        roles.role_id as role
                FROM "Users"
                LEFT JOIN   (SELECT follower_id, 
                                    count(*) AS following_count 
                            FROM "Followers" GROUP BY follower_id) 
                AS b ON "Users".id = b.follower_id
                LEFT JOIN   (SELECT following_id, 
                                    count(*) AS followers_count 
                            FROM "Followers" GROUP BY following_id) 
                AS qq ON "Users".id = qq.following_id

                LEFT JOIN (SELECT  "Followers".following_id 
                FROM "Followers" where follower_id = ${
                    req?.user?.id ?? null
                } GROUP BY following_id ) 
                AS t ON t.following_id = "Users".id

                JOIN (SELECT role_id, "UserRoles".user_id 
                FROM "UserRoles") 
                as roles on roles.user_id = "Users".id

                LIMIT ${LIMIT} OFFSET ${LIMIT * (page - 1)} 
                `)
            )[0] as IUser[];

            users = users.map((user) => {
                //@ts-ignore
                delete user.password;
                return user;
            });

            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Users" 
            `)
            )[0][0] as IPaginationInfo;

            const response: IPaginationResponse<IUser> = {
                page: parseInt(page),
                result: users,
                total_count: details.total_count,
                total_pages: details.total_pages,
            };

            res.json(response);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async get(req, res, next) {
        try {
            const { id } = req.params;
            const user = (
                await sequelize.query(`
                SELECT  "Users".*, 
                        CAST(COALESCE(qq.followers_count, 0) AS INTEGER) followers_count,
                        CAST(COALESCE(b.following_count, 0) AS INTEGER) following_count,
                        t.following_id followed_by_me,
                        roles.role_id as role
                FROM "Users"
                LEFT JOIN   (SELECT follower_id, 
                                    count(*) AS following_count 
                            FROM "Followers" GROUP BY follower_id) 
                AS b ON "Users".id = b.follower_id
                LEFT JOIN   (SELECT following_id, 
                                    count(*) followers_count 
                            FROM "Followers" GROUP BY following_id) 
                AS qq ON "Users".id = qq.following_id

                LEFT JOIN (SELECT  "Followers".following_id 
                FROM "Followers" where follower_id = ${
                    req?.user?.id ?? null
                } GROUP BY following_id ) 
                AS t ON t.following_id = "Users".id
                
                JOIN (SELECT role_id, "UserRoles".user_id 
                FROM "UserRoles") 
                as roles on roles.user_id = "Users".id

                WHERE "Users".id = ${id}`)
            )[0][0];
            if (!user) {
                return next(CustomError.notFound('User was not found'));
            }
            //@ts-ignore
            delete user.password;
            res.json(user);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async follow(req, res, next) {
        try {
            const { id } = req.params;
            if (id != req.user.id) {
                const isFollowed = await Followers.findOne({
                    where: { follower_id: req.user.id, following_id: id },
                });
                if (!isFollowed) {
                    const user = await User.findOne({ where: { id } });

                    if (user) {
                        await Followers.create({
                            follower_id: req.user.id,
                            following_id: id,
                        });
                    }

                    res.json({ status: 'ok' });
                } else {
                    return next(
                        new CustomError(409, 'You are already followed')
                    );
                }
            }

            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async unfollow(req, res, next) {
        try {
            const { id } = req.params;
            const row = await Followers.findOne({
                where: { follower_id: req.user.id, following_id: id },
            });
            if (row) {
                await Followers.destroy({
                    where: { follower_id: req.user.id, following_id: id },
                });
                res.json({ status: 'ok' });
            } else {
                return next(new CustomError(409, 'You are not followed'));
            }
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async update(req: AuthRequest, res, next) {
        try {
            const { id } = req.params;
            if (parseInt(id) != req.user.id) {
                return next(CustomError.unauthorized('Unauthorized'));
            }

            const newUserData = { ...req.body };
            const convert = (str: any) => (str ? `'${str}'` : null);
            const kek = await sequelize.query(
                `UPDATE "Users" SET username=${convert(newUserData.username)},
                                    first_name=${convert(
                                        newUserData.first_name
                                    )},
                                    last_name=${convert(newUserData.last_name)},
                                    avatar_url=${convert(
                                        newUserData.avatar_url
                                    )},
                                    background_image_url=${convert(
                                        newUserData.background_image_url
                                    )},
                                    description=${convert(
                                        newUserData.description
                                    )}

                 where id = ${id}`
            );
            res.json({ status: 'ok' });
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async getFollowersById(req, res, next) {
        try {
            const uid = req.params.id;
            const { page = 1 } = req.query;

            const users = (
                await sequelize.query(
                    `SELECT "Users".id, 
                            "Users".username, 
                            "Users".first_name, 
                            "Users".last_name, 
                            "Users".avatar_url,
                            t.following_id followed_by_me
                    FROM "Followers" 
                INNER JOIN "Users" ON follower_id = "Users".id

                LEFT JOIN (SELECT  "Followers".following_id 
                FROM "Followers" where follower_id = ${
                    req?.user?.id ?? null
                } group by following_id ) 
                AS t ON t.following_id = "Users".id

                WHERE "Followers".following_id = ${uid}
                ORDER BY "Users".id
                LIMIT ${LIMIT} OFFSET ${LIMIT * (page - 1)} `
                )
            )[0] as ISimpleUser[];
            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Followers" WHERE following_id = ${uid} 
            `)
            )[0][0] as IPaginationInfo;

            const response: IPaginationResponse<ISimpleUser> = {
                page: parseInt(page),
                result: users,
                total_count: details.total_count,
                total_pages: details.total_pages,
            };
            res.json(response);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }

    async getFollowingById(req, res, next) {
        try {
            const uid = req.params.id;
            const { page = 1 } = req.query;

            const users = (
                await sequelize.query(
                    `SELECT "Users".id, 
                            "Users".username, 
                            "Users".first_name, 
                            "Users".last_name, 
                            "Users".avatar_url,
                            t.following_id followed_by_me
                    FROM "Followers" 
            INNER JOIN "Users" ON following_id = "Users".id

            LEFT JOIN (SELECT  "Followers".following_id 
            FROM "Followers" where follower_id = ${
                req?.user?.id ?? null
            } group by following_id ) 
                AS t ON t.following_id = "Users".id

            where "Followers".follower_id = ${uid} 
            ORDER BY "Users".id
            LIMIT ${LIMIT} OFFSET ${LIMIT * (page - 1)}`
                )
            )[0] as ISimpleUser[];
            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Followers" WHERE follower_id = ${uid} 
            `)
            )[0][0] as IPaginationInfo;
            const response: IPaginationResponse<ISimpleUser> = {
                page: parseInt(page),
                result: users,
                total_count: details.total_count,
                total_pages: details.total_pages,
            };
            res.json(response);
            next();
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async getPostsByUserId(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1 } = req.query;

            const posts = (
                await sequelize.query(`
                SELECT "Posts".*, 
                        CAST(COALESCE(b.likes, 0) AS INTEGER) likes_count, 
                        CAST(COALESCE((b.total - b.likes), 0) AS INTEGER) dislikes_count,
                        likesTable.liked liked_by_me,
                        CAST(COALESCE(comments.count, 0) AS INTEGER) comments_count,
                        "Users".first_name as author_first_name,
                        "Users".last_name as author_last_name,
                        "Users".avatar_url as author_avatar_url
                FROM "Posts"

                LEFT JOIN   (SELECT post_id, 
                                COUNT(*) total, 
                                SUM(liked) likes 
                            FROM "Likes" GROUP BY post_id) 
                AS b ON "Posts".post_id = b.post_id

                LEFT JOIN (SELECT liked, post_id FROM "Likes"
                WHERE user_id = ${req?.user?.id ?? null}) 
                AS likesTable ON "Posts".post_id = likesTable.post_id
                
                JOIN "Users" on "Users".id = ${id}

                LEFT JOIN (SELECT COUNT(*), 
                       post_id FROM "Comments"
                       GROUP BY post_id) comments
                ON comments.post_id = "Posts".post_id
                
                WHERE "Posts".author_id = ${id}
                ORDER BY "Posts".post_id DESC LIMIT ${LIMIT} OFFSET ${
                    LIMIT * (page - 1)
                }`)
            )[0] as IPost[];

            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Posts" WHERE "Posts".author_id = ${id} 
            `)
            )[0][0] as IPaginationInfo;
            res.json({
                page: parseInt(page),
                result: await Promise.all(
                    posts.map(async (post) => {
                        post.attachments = await getPostAttachments(
                            post.post_id
                        );
                        return post;
                    })
                ),
                total_count: details.total_count,
                total_pages: details.total_pages,
            } as IPaginationResponse<IPost>);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async getFollowingPostsByUserId(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1 } = req.query;

            const posts = (
                await sequelize.query(`
            SELECT "Posts".*, 
                    CAST(COALESCE(b.likes, 0) AS INTEGER) likes_count, 
                    CAST(COALESCE((b.total - b.likes), 0) AS INTEGER) dislikes_count,
                    likesTable.liked liked_by_me,
                    CAST(COALESCE(comments.count, 0) AS INTEGER) comments_count,
                    "Users".first_name as author_first_name,
                    "Users".last_name as author_last_name,
                    "Users".avatar_url as author_avatar_url
            FROM "Posts"
    
            LEFT JOIN   (SELECT post_id, 
                            COUNT(*) total, 
                            SUM(liked) likes 
                        FROM "Likes" GROUP BY post_id) 
            AS b ON "Posts".post_id = b.post_id
    
            LEFT JOIN (SELECT liked, post_id FROM "Likes" 
            WHERE user_id = ${req?.user?.id ?? null}) 
            AS likesTable ON "Posts".post_id = likesTable.post_id
            
            LEFT JOIN (SELECT COUNT(*), 
                   post_id FROM "Comments"
                   GROUP BY post_id) comments
            ON comments.post_id = "Posts".post_id
            
            JOIN "Users" on "Users".id = "Posts".author_id

            WHERE "Posts".author_id in (SELECT following_id as id 
                                        FROM "Followers"
                                        WHERE follower_id = ${id}
                                        UNION ALL 
                                        SELECT ${id})
            ORDER BY "Posts".post_id DESC LIMIT ${LIMIT} OFFSET ${
                    LIMIT * (page - 1)
                }
            `)
            )[0] as IPost[];
            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
            CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Posts" 
            WHERE "Posts".author_id in (SELECT following_id as id 
                FROM "Followers"
                WHERE follower_id = ${id}
                UNION ALL 
                SELECT ${id})
            `)
            )[0][0] as IPaginationInfo;
            res.json({
                page: parseInt(page),
                result: await Promise.all(
                    posts.map(async (post) => {
                        post.attachments = await getPostAttachments(
                            post.post_id
                        );
                        return post;
                    })
                ),
                total_count: details.total_count,
                total_pages: details.total_pages,
            } as IPaginationResponse<IPost>);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async getCommentsByUserId(req, res, next) {
        try {
            const { id } = req.params;
            const comments = (
                await sequelize.query(`
            SELECT "Comments".*, 
                    CAST(COALESCE(b.likes, 0) AS INTEGER) AS likes_count, 
                    CAST(COALESCE((b.total - b.likes), 0) AS INTEGER) AS dislikes_count
            FROM "Comments"
            LEFT JOIN   (SELECT comment_id, 
                                count(*) AS total, 
                                SUM(liked) AS likes 
                        FROM "CommentLikes" GROUP BY comment_id) 
            AS b ON "Comments".comment_id = b.comment_id
            WHERE "Comments".author_id = ${id}
            ORDER BY "Comments".comment_id`)
            )[0];
            res.json(comments);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async giveRole(req, res, next) {
        try {
            const { id } = req.params;

            const role = await Role.findOne({
                where: { role_id: req.body.role },
            });

            if (!role) {
                return next(
                    CustomError.notFound(
                        `"${req.body.role}" role does not exis`
                    )
                );
            }
            await sequelize.query(`
                   UPDATE "UserRoles" 
                   SET role_id = ${role.role_id} 
                   WHERE user_id = ${id}
            `);

            res.json({ status: 'ok' });
        } catch (error) {
            CustomError.internal(error.message);
        }
    }
    async search(req, res, next) {
        try {
            const { query, page } = req.query;

            const result = (
                await sequelize.query(`
                SELECT id, avatar_url, username, first_name, last_name 
                FROM "Users" 
                WHERE LOWER(CONCAT(first_name, last_name)) LIKE LOWER('%${query}%') 
                LIMIT ${LIMIT} OFFSET ${LIMIT * (page - 1)}
            `)
            )[0] as ISimpleUser[];

            const details = (
                await sequelize.query(`
            SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                   CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
            FROM "Users" 
            WHERE LOWER(CONCAT(first_name, last_name)) LIKE LOWER('%${query}%')  
            `)
            )[0][0] as IPaginationInfo;
            const response: IPaginationResponse<ISimpleUser> = {
                page: parseInt(page),
                result,
                total_count: details.total_count,
                total_pages: details.total_pages,
            };
            res.json(response);
        } catch (error) {
            CustomError.internal(error.message);
        }
    }
    async getImages(req, res, next) {
        try {
            const { id } = req.params;
            const { page = 1 } = req.query;

            const images = (
                await sequelize.query(`
            SELECT "ProfileImages".url
                    
            FROM "ProfileImages"
    
            WHERE author_id = ${id} and post_id IS NOT NULL
            
            LIMIT ${LIMIT} OFFSET ${LIMIT * (page - 1)}
            `)
            )[0] as { url: string }[];

            const details = (
                await sequelize.query(`
                SELECT CAST(COUNT(*) AS INTEGER) total_count, 
                       CEILING (CAST(COUNT(*) AS FLOAT) / ${LIMIT}) total_pages 
                FROM "ProfileImages" 
                WHERE author_id = ${id} and post_id IS NOT NULL
            `)
            )[0][0] as IPaginationInfo;
            res.json({
                page: parseInt(page),
                result: images.map((obj) => obj.url),
                total_count: details.total_count,
                total_pages: details.total_pages,
            } as IPaginationResponse<string>);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
}
export default new UsersController();

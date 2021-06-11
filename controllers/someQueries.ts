import sequelize from '../db';
import { Roles } from '../roles';
import { IComment, IPost } from './interfaces';

export const getRole = async (id: number) =>
    (
        await sequelize.query(
            `SELECT role_id as role FROM "UserRoles" WHERE user_id = ${id}`
        )
    )[0][0] as {
        role: Roles;
    };

export const getPostAttachments = async (post_id: number) => {
    return (
        await sequelize.query(
            `SELECT url FROM "ProfileImages" WHERE post_id = ${post_id}`
        )
        //@ts-ignore
    )[0].map((el) => el.url) as string[];
};

export const getCommentAttachments = async (comment_id: number) => {
    return (
        await sequelize.query(
            `SELECT url FROM "ProfileImages" WHERE comment_id = ${comment_id}`
        )
        //@ts-ignore
    )[0].map((el) => el.url) as string[];
};

export const getComment = async (
    comment_id,
    user_id
): Promise<IComment | null> => {
    console.log('SADSDADSSDA', comment_id, user_id);
    const comment = (
        await sequelize.query(
            `select "Comments".*, 
                    CAST(coalesce(b.likes, 0) as INTEGER) as likes_count, 
                    CAST(coalesce((b.total - b.likes), 0) as INTEGER) as dislikes_count,
                    likesTable.liked liked_by_me,
                    "Users".first_name as author_first_name,
                    "Users".last_name as author_last_name,
                    "Users".avatar_url as author_avatar_url
            FROM "Comments"
            left join (select comment_id, count(*) as total, SUM(liked) as likes from "CommentLikes" group by comment_id) 
            as b on "Comments".comment_id = b.comment_id

            LEFT JOIN (SELECT liked, comment_id FROM "CommentLikes" where user_id = ${user_id}) 
            AS likesTable ON "Comments".comment_id = likesTable.comment_id

            JOIN "Users" on "Users".id = "Comments".author_id
            WHERE "Comments".comment_id = ${comment_id}`
        )
    )[0][0] as IComment;
    if (!comment) {
        return null;
    }
    comment.attachments = await getCommentAttachments(comment_id);
    return comment;
};

export const getPost = async (post_id, user_id): Promise<IPost | null> => {
    const post = (
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

            JOIN "Users" on "Users".id = "Posts".author_id

            WHERE "Posts".post_id = ${post_id}`)
    )[0][0] as IPost;
    if (!post) {
        return null;
    }
    post.attachments = await getPostAttachments(post_id);

    return post;
};

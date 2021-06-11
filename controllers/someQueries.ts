import sequelize from '../db';
import { Roles } from '../roles';

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
    )[0].map((el) => el.url) as string[];
};


export const getCommentAttachments = async (comment_id: number) => {
    return (
        await sequelize.query(
            `SELECT url FROM "ProfileImages" WHERE comment_id = ${comment_id}`
        )
    )[0].map((el) => el.url) as string[];
};

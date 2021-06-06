import { Roles } from './../roles';
import Express from 'express';
export interface IPaginationInfo {
    total_pages: number;
    total_count: number;
}

export interface IPaginationResponse<T> extends IPaginationInfo {
    page: number;
    result: T[];
}

export interface IUser {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    createdAt: string;
    followers_count: number;
    following_count: number;
    followed_by_me: number | null;
    background_image_url: string;
    role: Roles;
}

export interface IPost {
    post_id: number;
    author_id: number;
    body: string;
    createdAt: string;
    updatedAt: string;
    likes_count: number;
    dislikes_count: number;
    liked_by_me: number | null;
    comments_count: number;
}

export interface IComment {
    comment_id: number;
    post_id: number;
    author_id: number;
    body: string;
    createdAt: string;
    updatedAt: string;
    likes_count: number;
    dislikes_count: number;
    attachments: [{ path: string; createdAt: string }];
}

export type UserInfo = Pick<
    IUser,
    | 'avatar_url'
    | 'id'
    | 'background_image_url'
    | 'first_name'
    | 'last_name'
    | 'username'
>;
export type AuthRequest = Express.Request & {
    user: UserInfo;
};

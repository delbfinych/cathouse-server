import { Comments } from './comment.model';
import { Followers, FollowerUser } from './follower.model';
import { Posts } from './post.model';
import { Roles } from './role.model';
import { Users } from './user.model';
import { UserRoles } from './userRole.model';
import { Likes } from './likes.model';
import { CommentLikes } from './commentLikes.model';
import { ProfileImages } from './profileImages';
// import { CommentAttachment } from './commentAttachment.model';
// import { PostAttachment } from './postAttachment.model';
// import { Media } from './media.model';
import { File } from './file.model';

Users.hasMany(File, {
    foreignKey: 'user_id',
});

Users.hasMany(Posts, {
    foreignKey: 'author_id',
});

Users.hasMany(Followers);
Followers.belongsToMany(Users, { through: FollowerUser });

Users.hasMany(UserRoles, {
    foreignKey: 'user_id',
});

Roles.hasMany(UserRoles, {
    foreignKey: 'role_id',
});

Posts.hasMany(Comments, {
    foreignKey: 'post_id',
});

Posts.hasMany(Likes, {
    foreignKey: 'post_id',
});

Comments.hasMany(CommentLikes, {
    foreignKey: 'comment_id',
});

Users.hasMany(ProfileImages, {
    foreignKey: 'author_id',
    foreignKeyConstraint: true,
});

Posts.hasMany(ProfileImages, {
    foreignKey: 'post_id',
    foreignKeyConstraint: true,
});

Comments.hasMany(ProfileImages, {
    foreignKey: 'comment_id',
    foreignKeyConstraint: true,
});



export {
    Comments as Comment,
    Followers as Follower,
    Posts as Post,
    Roles as Role,
    UserRoles as UserRole,
    Likes,
    Users as User,
    CommentLikes,
    File,
    ProfileImages
};

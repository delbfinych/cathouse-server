import { Comments } from './comment.model';
import { Followers, FollowerUser } from './follower.model';
import { Posts } from './post.model';
import { Roles } from './role.model';
import { Users } from './user.model';
import { UserRoles } from './userRole.model';
import { Likes } from './likes.model';
import { CommentLikes } from './commentLikes.model';
import { CommentAttachment } from './commentAttachment.model';
import { PostAttachment } from './postAttachment.model';
import { Media } from './media.model';
import { File } from './file.model';

Users.hasMany(File);
File.belongsTo(Users, {
    foreignKey: 'user_id',
});
Users.hasMany(Posts);
Posts.belongsTo(Users, {
    foreignKey: 'author_id',
});

Users.hasMany(Followers);
Followers.belongsToMany(Users, { through: FollowerUser });

Users.hasMany(UserRoles);
UserRoles.belongsTo(Users, {
    foreignKey: 'user_id',
});

UserRoles.belongsTo(Roles, {
    foreignKey: 'role_id',
});
Roles.hasMany(UserRoles);

Posts.hasMany(Comments);
Comments.belongsTo(Posts, {
    foreignKey: 'post_id',
});

Posts.hasMany(Likes);
Likes.belongsTo(Posts, {
    foreignKey: 'post_id',
});

Posts.hasMany(CommentLikes);
CommentLikes.belongsTo(Posts, {
    foreignKey: 'post_id',
});

Comments.hasMany(CommentAttachment);
CommentAttachment.belongsTo(Comments, { foreignKey: 'comment_id' });

Posts.hasMany(PostAttachment);
PostAttachment.belongsTo(Posts, { foreignKey: 'post_id' });

export {
    Comments as Comment,
    Followers as Follower,
    Posts as Post,
    Roles as Role,
    UserRoles as UserRole,
    Likes,
    Users as User,
    CommentLikes,
    CommentAttachment,
    PostAttachment,
    Media,
    File,
};

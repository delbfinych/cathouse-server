import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { User, UserRole, Role } from '../models/models';
import { Roles } from '../roles';

const generateJwt = (obj) => {
    return jwt.sign({ ...obj }, process.env.SECRET_KEY);
};

class AuthController {
    async signUp(req, res, next) {
        const { username, password, first_name, last_name } = req.body;


        if (!username || !password) {
            return next(
                CustomError.unauthorized('Incorrect username or password')
            );
        }
        if (!last_name || !first_name) {
            return next(CustomError.unauthorized('Incorrect user data'));
        }
        try {
            const candidate = await User.findOne({ where: { username } });

            if (candidate) {
                return next(
                    new CustomError(
                        409,
                        'User with this username already exists'
                    )
                );
            }
            const filename = req.file?.filename;

            const hashedPassword = await bcrypt.hash(password, 5);
            const user = await User.create({
                username: '@' + username,
                password: hashedPassword,
                first_name,
                last_name,
                avatar_url: filename,
            });
            const role = await Role.findOne({
                where: { role_name: Roles.USER },
            });
            await UserRole.create({
                user_id: user.id,
                role_id: role.role_id,
            });
            const token = generateJwt({
                id: user.id,
                username: '@' + username,
                first_name,
                last_name,
                role: role.role_name,
                avatar_url: filename,
            });
            return res.json({ token });
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }

    async signIn(req, res, next) {
        const { username, password } = req.body;
        const user = await User.findOne({
            where: { username: '@' + username },
        });
        if (!user) {
            return next(CustomError.notFound('User was not found'));
        }
        let comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
            return next(CustomError.unauthorized('Could not sign in'));
        }
        try {
            const role = (
                await sequelize.query(
                    `SELECT role_name FROM "Roles"
                     WHERE role_id IN (
                        SELECT MAX(role_id) FROM "UserRoles" WHERE user_id = ${user.id}
                     )`
                )
            )[0][0];
            const token = generateJwt({
                id: user.id,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                //@ts-ignore
                role: role.role_name,
                avatar_url: user.avatar_url,
            });
            
            return res.json({ token });
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }

    async signOut(req, res, next) {
        // TODO: SIGNOUT
        return res.json({
            message: 'Signed out successfuly',
        });
    }

    checkAuth = (required?: 'required') => async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!required && !token) {
                return next();
            }
           
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            req.token = token;
            req.user = decoded;
            next();
        } catch (e) {
            if (required) {
                return next(CustomError.unauthorized('Unauthorized'));
            }
            return next();
        }
    };

    checkRole = (roles: string[]) => async (req, res, next) => {
        const role = req.user.role;
        if (!roles.includes(role)) {
            next(CustomError.forbidden(`Permission denied`));
        }
        next();
    };

    async verifyUserName(req, res, next) {
        try {
            const username = req.query.username;
            if (username) {
                const user = await User.findOne({
                    where: { username: '@' + req.query.username },
                });
                if (user) {
                    return next(new CustomError(409, 'User already exists'));
                }
                res.json(user);
            } else {
                return next(CustomError.badRequest(''));
            }
        } catch (e) {
            next(CustomError.unauthorized('Unauthorized'));
        }
    }
    async verifyToken(req, res, next) {
        if (req.token) {
            res.send();
        }
    }
}

export default new AuthController();

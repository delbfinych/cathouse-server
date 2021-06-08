import { Roles } from './../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { Post } from '../models/models';
import { config } from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
config();

class FileController {
    // async create(req, res, next) {
    //     try {
    //         const { id } = req.user;
    //         const { content } = req.body;
    //         if (!content) {
    //             return next(CustomError.badRequest('Post content is empty'));
    //         }
    //         const post = await Post.create({ author_id: id, body: content });
    //         // TODO: likes/deslikes count ?
    //         res.json(post);
    //     } catch (error) {
    //         next(CustomError.internal(error.message));
    //     }
    // }
    async uploadToRemoteServer(req, res, next) {
        try {
            if (req.files) {
                req.files = Object.values(req.files)[0]
                for (let file of req.files) {
                    const fstr = fs.createReadStream(`./static/${file.filename}`);
                    const form = new FormData();
                    form.append('filename', fstr);
                    const res = await fetch(
                        'https://secure-ridge-70714.herokuapp.com/put',
                        {
                            method: 'POST',
                            body: form,
                        }
                    );
                    if (!res.ok) {
                        throw Error(res.statusText);
                    }
                }
                return next();
            }
            throw CustomError.badRequest("0 files uploaded")
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
}

export default new FileController();

import { Roles } from '../roles';
import sequelize from '../db';
import { CustomError } from '../error/CustomError';
import { ProfileImages } from '../models/models';
import { config } from 'dotenv';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { AttachmentsRequest } from './interfaces';
config();

class MediaController {
    async attachImage(req, res, next) {
        try {
            const { id } = req.user;
            const { body, comment_id, post_id }: AttachmentsRequest = req.body;
            const data = body.map((url) => {
                return {
                    comment_id,
                    post_id,
                    author_id: id,
                    url,
                };
            });
            const result = await ProfileImages.bulkCreate(data);
            res.json(result);
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
    async uploadToRemoteServer(req, res, next) {
        try {
            if (req.files) {
                req.files = Object.values(req.files)[0];
                for (let file of req.files) {
                    const fstr = fs.createReadStream(
                        `./static/${file.filename}`
                    );
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
            throw CustomError.badRequest('0 files uploaded');
        } catch (error) {
            next(CustomError.internal(error.message));
        }
    }
}

export default new MediaController();

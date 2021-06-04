import Multer from 'multer';
import { v4 } from 'uuid';

const storage = Multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/static');
    },
    filename: function (req, file, cb) {
        cb(null, `${v4()}.${file.mimetype.split('/')[1]}`);
    },
});
export const upload = Multer({
    storage,
});

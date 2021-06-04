import { CustomError } from './CustomError';

export const handleError = (err, req, res, next) => {
    if (err instanceof CustomError) {
        return res.status(err.status).json({ error: { message: err.message } });
    }
    return res.status(500).json({ message: 'Something went wrong...', extra: err.message });
};

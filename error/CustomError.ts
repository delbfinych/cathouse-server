export class CustomError extends Error {
    status: number;
    message: string;

    constructor(status, message) {
        super();
        this.status = status;
        this.message = message;
    }

    static badRequest(message) {
        return new CustomError(400, message);
    }

    static notFound(message) {
        return new CustomError(404, message);
    }

    static internal(message) {
        return new CustomError(500, message);
    }

    static forbidden(message) {
        return new CustomError(403, message);
    }

    static unauthorized(message) {
        return new CustomError(401, message);
    }
}

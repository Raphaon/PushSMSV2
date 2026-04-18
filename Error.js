export class ErrorHandler { 
    setError(message, statusCode) {
        this.message = message;
        this.statusCode = statusCode;
    }

    getError() {
        return {
            message: this.message,
            statusCode: this.statusCode
        };
    }
}
// class apiError extends Error {
//     constructor(
//         statusCode,
//         message="Somthing went wrong",
//         errors=[],
//         stack=""
//     ){
//         super(message)
//         this.statusCode=statusCode
//         this.data=null, //read documentation for this.data
//         this.message=message,
//         this.success=false,
//         thia.errors=errors
//         if(stack){
//             this.stack=stack
//         }else{
//             Error.captureStackTrace(this, this.constructor)
//         }
//     }
// }
// export {apiError}


/**
 * Custom API Error class that extends the built-in Error class
 * Used for creating consistent error objects across the API
 */
class apiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code for the error
     * @param {string} message - Error message (default: "Something went wrong")
     * @param {Array} errors - Array of additional error details
     * @param {string} stack - Error stack trace (optional)
     */
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        // Call the parent Error constructor with the provided message
        super(message);

        // Set custom properties
        this.statusCode = statusCode;
        this.data = null; // Placeholder for additional error data
        this.message = message;
        this.success = false; // Indicate that the operation was not successful
        this.errors = errors; // Array to hold multiple error messages or details

        // Set the stack trace
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { apiError }
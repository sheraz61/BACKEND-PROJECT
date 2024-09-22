// class apiResponse{
//     constructor(statusCode,data,message="success"){
//         this.statusCode=statusCode;
//         this.data=data;
//         this.message=message;
//         this.success=statusCode<400
//     }
// }
/**
 * Custom API Response class for creating consistent response objects
 */
class apiResponse {
    /**
     * @param {number} statusCode - HTTP status code for the response
     * @param {any} data - The data to be sent in the response
     * @param {string} message - A message describing the response (default: "success")
     */
    constructor(statusCode, data, message = "success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { apiResponse }
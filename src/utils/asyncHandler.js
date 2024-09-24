/**
 * asyncHandler is a utility function for wrapping Express route handlers
 * to automatically catch and forward any errors to Express's next() function.
 * 
 * @param {Function} requestHandler - The async function to be wrapped
 * @returns {Function} A new function that wraps the requestHandler
 */

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    }
}


export  default asyncHandler


//this is Try Cathc method for handler function
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
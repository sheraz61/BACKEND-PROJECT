// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// const app = express()
// //use use for middelwares or configuration
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))
// //configuration of middelwares to accept json response
// app.use(express.json({
//     limit: "16kb"
// }))
// //configuration if data send from url
// app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// //configuration of middelwares  use to store file and folders in public folder
// app.use(express.static("public"))
// //configuration of middelwares cookieparser to store user cookies in browser
// app.use(cookieParser())
// export { app }


// Import required modules
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Create an Express application
const app = express()

// Configure CORS middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN, // Allow requests from this origin
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}))

// Configure middleware to parse JSON requests
app.use(express.json({
    limit: "16kb" // Limit JSON payload size to 16kb
}))

// Configure middleware to parse URL-encoded data
app.use(express.urlencoded({ 
    extended: true, // Allow parsing of nested objects
    limit: "16kb" // Limit URL-encoded payload size to 16kb
}))

// Serve static files from the 'public' directory
app.use(express.static("public"))

// Parse cookies in incoming requests
app.use(cookieParser())

// Export the configured Express application
export { app } 
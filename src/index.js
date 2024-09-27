// require('dotenv').config({path:'./env'})
import dotenv from 'dotenv'
import { connectDB } from '../src/db/index.js'
import { app } from './app.js';
dotenv.config({
    path:'./.env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server listening on ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log('MongoDB error:',err);
    
})







/*
import express from "express";
const app = express();

; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log('error', error);
            throw (error)
        })
        app.listen(process.env.PORT,()=>{
            console.log(`listening on ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error(error);
        throw error
    }
})()
*/

    
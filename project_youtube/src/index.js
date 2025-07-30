// require('dotenv').config({path: './env'});
import dotenv from 'dotenv';
dotenv.config({path: './env'}); //better version

// import mongoose from 'mongoose';
// import { DB_NAME } from './contents';
import express from 'express';
import connectDB from './db/index.js';
const app=express();


//effing
// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",()=>{
//             console.log("Error",error);
//             throw error;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`);
//         });
//     }catch(error){
//         console.error('Error connecting to MongoDB:', error);
//     }
// })()



connectDB() //returns a promise
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((error)=>{
    console.error('Error connecting to MongoDB:', error);
})
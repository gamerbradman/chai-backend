import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { application } from 'express';
dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running at port ${process.env.PORT}`);
        });
    app.on("error",()=>{
        console.log(`server failed due to :${Error}`);
        })
})
.catch((err)=>{
    console.log(`MONGODB CONNECTION FAILed , ERROR=${err}`);
    
})








/*
import express from 'express'
const app =express()

;(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${db_name}`)
        
        app.on('error',(error)=>{
        console.log('error',error);
        })
    
        app.listen(process.env.PORT,()=>{
        console.log(`App is listening on ${process.env.PORT}`);
        })
    } catch (error) {
    console.error(`error: ${error}`);
    }
})()
    */
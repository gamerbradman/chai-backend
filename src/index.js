import dotenv from 'dotenv'
import connectDB from './db/index.js';
import { application } from 'express';
import { app } from './app.js';
dotenv.config({
    path:'./env'
})

const port = process.env.PORT

connectDB() 
.then(()=>{
    app.listen(port,()=>{
        console.log(`server is running at port ${port}`);
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
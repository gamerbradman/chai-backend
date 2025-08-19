import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app=express()

//app.use is used for middlewares
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))


app.use(express.json({limit:"16kb"}))           //for processing the json file obtained
app.use(express.urlencoded({limit:"16kb", extended:true}))  //for processing the link
app.use(express.static("public"))       //for storing public assets
app.use(cookieParser())



//routes import
import userRoute from "./routes/user.routes.js"

//routes declaration
app.use('/api/v1/users',userRoute)          //a middleware that sends control to userRoute whenever /users is visited


export {app}
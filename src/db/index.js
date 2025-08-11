import mongoose from 'mongoose'
import { db_name } from '../constants.js'

const connectDB=async ()=>{
    try {
       const connectioninstance= await mongoose.connect(`${process.env.MONGODB_URL}/${db_name}`)
        console.log(`\n  mongodb connected db host // \n db host:${connectioninstance.connection.host}` );
        
    } catch (error) {
        console.log(`mongodbconnection failed :${error}`);
        process.exit(1)
    }
}

export default connectDB
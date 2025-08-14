import mongoose,{Schema} from 'mongoose';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema= new Schema(
    {
        username:{
            type:String,
            required:true,
            trim:true,
            lowercase:true,
            index:true      //to make any property searchable index is set to true
        },
        email:{
            type:String,
            required:true,
            trim:true,
            lowercase:true,
            index:true      //to make any property searchable index is set to true
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true      //to make any property searchable index is set to true
        },
        avatar:{
            type:String,   //cloudinary url
            required:true
        },
        coverImage:{
            type:String     //cloudinary url
        },
        watchHistory:[{
            type:Schema.Types.ObjectId,
            ref:"Video"
        }],
        password:{
            type:String,
            required:[true,'password is required']
        },
        refreshtoken:{
            type:String
        }
        
    },{timestamps:true}
)
//using pre hook
userSchema.pre("save",async function(next){             //next is a flag which must be passed on succesful completion of the middleware, so mention next() before end
    if(!this.isModified("password")) return next(); //when password isnt modified directly jumps to next

   this.password= await bcrypt.hash(this.password , 10)     //run 10 cycles of encryption
    next()
})                             //arrow function cant be used as it doesnt have reference of this

//to create new methods
userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {_id:this.id,
         email:this.email,
         username:this.username,
         fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}


userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {_id:this.id,
        
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}

export const User=mongoose.model("User",userSchema)
  

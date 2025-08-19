import { asynchandler } from "../utils/aysnchandler.js";
import { APIerror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/APIresponse.js";




const registerUser=asynchandler ( async (req,res) => {
     // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const {fullname,email,username,password}=req.body    //destructures these datas from the data in request body

        if ( [ fullname,email,username,password ].some((field)=>field?.trim()==="" ) ){
        throw new APIerror( 400,"all fields are required")
        }


    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })

        if(existedUser){
            throw new APIerror(401,"user with email or username already exists")
        }

    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverImage[0]?.path

        if(!avatarLocalPath){
            throw new APIerror(400,"avatar file is required")
        }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){
            throw new APIerror(400,"avatar file is required")
        }


    const user= User.create({
        fullname,
        email,
        password,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        username:username.toLowerCase()
        }
    )

    const createdUser=await User.findById(user._id).select(    
        "-password -refreshToken"               //bydefault everything is selected so we need to unselect these ones in this syntax
    )

        if(!createdUser){
            throw new APIerror(500,"something went wrong while registering the error")
            }

    return res.status(201).json(
        new APIresponse(200,createdUser,"user registered successfully")
    )

}
)

export {registerUser}
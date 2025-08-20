import { asynchandler } from "../utils/aysnchandler.js";
import { APIerror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/APIresponse.js";



const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
    
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})   //we need to save the refresh token now but we dont have other fields like passwords which are required.it would be a error so we turn of validate before save
    
        return {accessToken,refreshToken}
    } catch (error) {
        throw new APIerror(500,"something went wrong while generating access and refresh token")
    }

}




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
    // console.log(req)
    // console.log(req.body);
    
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
    // const coverImageLocalPath=req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


        if(!avatarLocalPath){
            throw new APIerror(400,"avatar file is required")
        }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

        if(!avatar){
            throw new APIerror(400,"avatar file is required")
        }


    const user= await User.create({
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
            throw new APIerror(500,"something went wrong while registering the user")
            }

    return res.status(201).json(
        new APIresponse(200,createdUser,"user registered successfully")
    )

}
)



const loginUser = asyncHandler(async (req, res)=>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

        const {email,username,password}=req.body
        if(!username && !email){
            throw new APIerror(400,"username or email is required")
        }

        
        const user =await User.findOne({
            $or:[{username},{email}]                //a mongoose property that tries to find an user with any one of these
        })
        if(!user){
            throw new APIerror(404,"user doesnt exist")
        }


        const isPasswordValid= await user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new APIerror(401,"invalid user credentials")
        }

        const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

        const loggedInUser=await User.findById(user._id).select("-password -refreshtoken")

        const options={                 //makes the cookies only editable by browser
            httpOnly:true,
            secure:true
        }
        

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new APIresponse(
                200,
                {
                    user:loggedInUser,accessToken,refreshToken   //we send in this format again for if the user wants to access these values
                },
                "user logged in successfully"
            )
        )
        

})

const logoutUser=asynchandler(async(req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1   //this removes the field from the doc
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new APIresponse(200,{},"user logged out"))
})




export {registerUser,loginUser,logoutUser}
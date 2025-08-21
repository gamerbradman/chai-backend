import { asynchandler } from "../utils/aysnchandler.js";
import { APIerror } from "../utils/apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { APIresponse } from "../utils/APIresponse.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import JWT from "jsonwebtoken"
import { app } from "../app.js";
import mongoose from "mongoose";


const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
    
        user.refreshToken=refreshToken


        console.log("user", user)

        const savedUser = await user.save()   //we need to save the refresh token now but we dont have other fields like passwords which are required.it would be a error so we turn of validate before save
        console.log("log", savedUser)
    
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


const loginUser = asynchandler(async (req, res)=>{
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

        const loggedInUser=await User.findById(user._id).select("-password -refreshToken")
        // console.log(loggedInUser);
        
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
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1   //this removes the field from the doc
            }
        },
        {
            new:true               //returns the new updated data
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

const refreshAccessToken=asynchandler(async(req,res)=>{
    try {
        const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken
        if(!incomingRefreshToken){
            throw new APIerror(401,"unothorized request")
            }
    
       const decodedToken= JWT.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
       const user= await User.findById(decodedToken?._id)
    
       if(!user){
        throw new APIerror(401,"invalid or expired refresh token")
            }
    
       
       const options={
        httpOnly:true,
        secure:true
       }
    
       const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id)
    
       
    
       return res
       .status(201)
       .cookie("accessToken",accessToken,options)
       .cookie("refreshToken",newRefreshToken,options)
       .json(
            new APIresponse(
                 200,
                 {accessToken,refreshToken:newRefreshToken},
                "accessToken refreshed"
            )
       )
    } catch (error) {
        throw new APIerror(401,error?.message||"invalid refresh token")
    }
})


const changePassword = asynchandler (async ( req , res ) => {
    const { oldPassword , newPassword } = req.body

    //we pass this route throught the auth middleware first which stores the value of the user in req.user
    const user = await User.findById ( req.user?._id )
    const isPasswordCorrect = await user.isPasswordCorrect ( oldPassword )      //isPasswordCorrect is a method i created for the userSchema which returns a true false value comapring the argument with the actual password
        if ( !isPasswordCorrect ) {
        throw new APIerror ( 401 , "invalid old password" )
        }

    user.password = newPassword
    await user.save( { validateBeforeSave:false } )  //this calls on the prehook that ecrypts the password before saving .

    return res
    .status(200)
    .json(new APIresponse(200,{},"password changed successfully"))

    

})


const getCurrentUser=asynchandler(async(req,res)=>{
    return res                  //as this route is already being passed through auth middleware , user is stored in req.user
    .status(201)
    .json(new APIresponse(
        201,
        req.user,
        "user fetched succesffully"
    ))
})


const updateAccountDetails=asynchandler(async(req,res)=>{
    const {fullname,email}=req.body
    if(!fullname||!email){
        throw new APIerror(401,"all fields are required")
    }

    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email   //both syntaxes are valid
            }
        },{new:true})           //returns the newly created object
    .select("-password")


    return res
    .status(200)
    .json(new APIresponse(200,user,"account details updated successfully"))


})

const updateUserAvatar= asynchandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    
    if (!avatarLocalPath) {
        throw new APIerror(401,"avatar file is missing")
    }

    
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if (!avatar?.url) {
        throw new APIerror("error while uploading avatar")
    }

   
    const user=await User.findByIdAndUpdate(
     req.user?._id,
     {
        $set:{
            avatar:avatar.url
        }
     },{new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new APIresponse(200,user,"avatar image updated succesfully"))


})



const updateCoverImage= asynchandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    
    if (!coverImageLocalPath) {
        throw new APIerror(401,"coverImage file is missing")
    }

    
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage?.url) {
        throw new APIerror("error while uploading coverimage")
    }

   
    const user=await User.findByIdAndUpdate(
     req.user?._id,
     {
        $set:{
            coverImage:coverImage.url
        }
     },{new:true}
   ).select("-password")

   return res
   .status(200)
   .json(new APIresponse(200,user,"coverImage updated succesfully"))


})


const getUserChannelProfile = asynchandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new APIerror(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",    //database converts Subscription to subscriptions
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new APIerror(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new APIresponse(200, channel[0], "User channel fetched successfully")
    )
})


const getUserWatchHistory=asynchandler(async(req,res)=>{
    const user=await User.aggregate([
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullName:1,
                                            username:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
    
    ])


    return res
    .status(200)
    .json(
        new APIresponse(
            200,
            user[0].watchHistory,
            "watchHistory fetched successfully"
        )
    )
})



export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changePassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateCoverImage,
        getUserChannelProfile,
        getUserWatchHistory}


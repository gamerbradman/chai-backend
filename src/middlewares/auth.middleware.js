import { User } from "../models/user.model.js";
import { APIerror } from "../utils/apierror";
import { asynchandler } from "../utils/aysnchandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT=asynchandler(async(req,_,next)=>{            //next is important so that the middleware passes the flag & res has no use so _ 
        try {
            const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","")        //from mobiles the token is sent through headers with key :Authorization and value as" Bearer Token"  , we wwant to extract just token so we replace with "bearer " with ""
            // console.log(token);
            
            if(!token){
                throw new APIerror(401,"unauthorized request")
            }
    
            const decodedToken=jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
            const user=await User.findById(decodedtoken?._id).select("-password -refreshToken")
    
            if(!user){
                throw new APIerror(401,"invalid access token")
            }
    
            req.user=user  //stores the value of user in req.user
            next()
        } catch (error) {
            throw new APIerror(401,error?.message||"invalid access token")
        }

    })
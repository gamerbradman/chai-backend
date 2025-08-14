import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});


const uploadOnCloudinary= async (localfilepath)=>{
    try {
        if(!localfilepath) return null;
        //upload file on cloudinary
        const respone=await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto'
        })

        //the file is first stored in local server using multer and then it is uploaded to cloudinary and now needs to be removed from the local server
        
        fs.unlinkSync(localfilepath)
        return respone;

    } catch (error) {
     fs.unlinkSync(localfilepath)   //remove the locally saved temporary file as the upload got failed
    return null
    }
}

export{uploadOnCloudinary}
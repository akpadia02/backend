import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localfilePath) => {
    try{
        if(!localfilePath) {
            throw new Error("No file path provided for upload.");
        }
        //upload the file to Cloudinary
        const response=await cloudinary.uploader.upload(localfilePath,{
            resource_type: "auto"
        })
        //file has been uploaded
        console.log("File uploaded successfully to Cloudinary.",response.url);
        return response;
    }catch(error){
        fs.unlinkSync(localfilePath); // Clean up the local file
        //remove the locally saved temporary file as the upload operation got failed
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
}

export default uploadOnCloudinary;
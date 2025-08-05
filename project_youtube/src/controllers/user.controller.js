// import asyncHandler from '../utils/asyncHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js'; 
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res, next) => {
  // Registration logic here
  
  //problem: register user
  // steps: 
  //     1)get user details from frontend
  //     2)validation (not empty)
  //     3)check if user already exists (username email)
  //     4)check for images and avatar so then upload them to cloudinary,avatar
  //     5)create user object- create entry in db
  //     6)remove passward and refresh token from response
  //     7)check for user creation
  //     8)return response

  // 1
  const {fullname,email,username,password}= req.body
  console.log(email);
  
  // 2
  // if(fullname===""){
  //   throw new ApiError(400, 'Fullname is required');
  // }
  if(
    [fullname,email,username,password].some((field) => 
      field?.trim()===""))
    {
        throw new ApiError(400, 'All fields are required')
    }

  // 3
  const existedUser = User.findOne({$or: [{email}, {username}]})
  if(existedUser){
    throw new ApiError(409, 'User already exists with email or username');
  }

  // 4
  const avatarLocalPath = req.files?.avatar[0]?.path;  //multer middleware and user routes
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, 'Avatar is required');
  }
  //upload avatar & coverimage to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!avatar){
    throw new ApiError(400, 'Avatar upload failed');
  }

  // 5
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  })

  //6
  const createdUser = await User.findById(user._id).select('-password -refreshToken'); //kya kya nhi chahiye response me

  //7
  if(!createdUser){
    throw new ApiError(500, 'User creation failed');
  }

  //8
  return res.status(201).json(
    new ApiResponse(200, createdUser, 'User registered successfully')
  );





    // res.status(200).json({ 
    //     message: 'User registered successfully' 
    // });
});

export { registerUser };
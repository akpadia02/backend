// import asyncHandler from '../utils/asyncHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { subscribe } from 'diagnostics_channel';

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token in user document
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new ApiError(500, 'Something went wrong while generating tokens');
  }
}


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
  const { fullName, email, username, password } = req.body
  console.log(email);

  // 2
  // if(fullname===""){
  //   throw new ApiError(400, 'Fullname is required');
  // }
  if (
    [fullName, email, username, password].some((field) =>
      field?.trim() === "")) {
    throw new ApiError(400, 'All fields are required')
  }

  // 3
  const existedUser = await User.findOne({ $or: [{ email }, { username }] })
  if (existedUser) {
    throw new ApiError(409, 'User already exists with email or username');
  }

  console.log(req.files);

  // 4
  const avatarLocalPath = req.files?.avatar[0]?.path;  //multer middleware and user routes
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }
  //upload avatar & coverimage to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
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
  if (!createdUser) {
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



const loginUser = asyncHandler(async (req, res, next) => {
  // Login logic here

  //1)req body->data
  //2)username or email
  //3)find user in db
  //4)check password
  //5)generate access token or refresh token
  //6)send cookies
  //7)send response


  //1
  const { email, password, username } = req.body;
  console.log(email);

  //2
  if (!email && !username) {
    throw new ApiError(400, 'Email or username is required');
  }
  //3
  // const user = await User.findOne({email});
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  //4
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password');
  }

  //5
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  //6
  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');
  // const options = {
  //   httpOnly: true,
  //   secure: true, // Set to true if using HTTPS
  // };
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    httpOnly: true,
    secure: isProduction,               // false in dev, true in prod (https)
    sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-site in prod
  };


  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
      200,
      {
        user: loggedInUser,
        accessToken,
        refreshToken
      },
      'User logged in successfully'
    ));

})

const logoutUser = asyncHandler(async (req, res) => {
  // Logout logic here
  //1)clear cookies
  //2)clear refresh token in db

  // req.user._id; //user id from verifyJWT middleware

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined //clear refresh token in db
      }
    }, {
    new: true, //return the updated document
  }
  )

  // const options = {
  //   httpOnly: true,
  //   secure: true, // Set to true if using HTTPS
  // };
  const isProduction = process.env.NODE_ENV === 'production';

  const options = {
    httpOnly: true,
    secure: isProduction,               // false in dev, true in prod (https)
    sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-site in prod
  };


  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, 'User logged out successfully'));
})

//endpoint for refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  //1)check for refresh token in cookies
  //2)verify refresh token
  //3)find user in db
  //4)match user with refresh token
  //5)generate new access token
  //6)return response

  // 1
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  if(!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request, refresh token is required');
  }
  try{
      // 2
    const decodedToken=jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

    //3 user info find
    const user=await User.findById(decodedToken?._id);
    if(!user) {
      throw new ApiError(404, 'User not found');
    }

    //4
    if(incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, 'Unauthorized request, refresh token mismatch');
    }

    //5
    const isProduction = process.env.NODE_ENV === 'production';

    const options = {
      httpOnly: true,
      secure: isProduction,               // false in dev, true in prod (https)
      sameSite: isProduction ? 'None' : 'Lax', // 'None' for cross-site in prod
    };

    const {accessToken , newRefreshToken}=await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken,refreshToken:newRefreshToken}, 'Access token refreshed successfully'));

  }catch(error) {
      console.error('Error refreshing access token:', error);
      throw new ApiError(500, 'Something went wrong while refreshing access token');
  }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Logic to change current password
  // 1) Get user id from req.user
  // 2) Get current password and new password from req.body
  // 3) Validate current password
  // 4) Update password in db
  // 5) Return response

  //2
  const { oldPassword, newPassword } = req.body;
  
  //1
  const user=await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  //3
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Current(old) password is incorrect');
  }

  //4
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  //5
  return res
  .status(200)
  .json(new ApiResponse(200, {}, 'Password changed successfully'));
  
});


const getCurrentUser = asyncHandler(async (req, res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, 'Current user fetched successfully'));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // Logic to update account details
  // 1) Get user id from req.user
  // 2) Get updated details from req.body
  // 3) Validate and update user in db
  // 4) Return response

  const { fullName, email} = req.body;

  if(!fullName || !email) {
    throw new ApiError(400, 'Full name and email are required');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set:{
        fullName,
        email: email,
      }
    },
    { new: true}
  ).select('-password '); // Exclude password and refreshToken from response

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
  .status(200)
  .json(new ApiResponse(200, user, 'Account details updated successfully'));
})


// const updateUserAvatar = asyncHandler(async (req, res) => {
//   // Logic to update user avatar
//   // 1) Get user id from req.user
//   // 2) Get avatar from req.file
//   // 3) Upload avatar to cloudinary
//   // 4) Update user in db
//   // 5) Return response

//   //2
//   const avatarLocalPath = req.file?.path;
//   if (!avatarLocalPath) {
//     throw new ApiError(400, 'Avatar is required');
//   }
  
//   //delete old image from cloudinary if exists todo


//   //3
//   const avatar = await uploadOnCloudinary(avatarLocalPath);
//   if (!avatar.url) {
//     throw new ApiError(400, 'Avatar upload failed on cloudinary');
//   }

//   //4
//   const user=await User.findByIdAndUpdate(
//     req.user?._id,
//     { 
//       $set: {
//         avatar: avatar.url
//       }
//     },
//     { new: true }
//   ).select('-password');

//   //5
//   return res
//   .status(200)
//   .json(new ApiResponse(200, user, 'Avatar updated successfully'));

// })

const updateUserAvatar = asyncHandler(async (req, res) => {
  // 1. Get user id from req.user
  const userId = req.user?._id;

  // 2. Get avatar from req.file
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }

  // 3. Get current user to access old avatar
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  // 4. Delete old image from Cloudinary if exists
  if (existingUser.avatar) {
    const publicId = extractPublicIdFromUrl(existingUser.avatar);
    if (publicId) {
      await deleteFromCloudinary(publicId);
    }
  }

  // 5. Upload new avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, 'Avatar upload failed on Cloudinary');
  }

  // 6. Update user with new avatar
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select('-password');

  // 7. Send response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, 'Avatar updated successfully'));
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
  // Logic to update user avatar
  // 1) Get user id from req.user
  // 2) Get avatar from req.file
  // 3) Upload avatar to cloudinary
  // 4) Update user in db
  // 5) Return response

  //2
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, 'Cover Image is required');
  }
  
  //3
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, 'Avatar upload failed on cloudinary');
  }

  //4
  const user=await User.findByIdAndUpdate(
    req.user?._id,
    { 
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select('-password');

  //5
  return res
  .status(200)
  .json(new ApiResponse(200, user, 'Cover Image updated successfully'));

})


const getUserChannelProfile = asyncHandler(async(req,red)=>{
  // Logic to get user channel profile
  // 1) Get user id from req.params
  // 2) Find user in db
  // 3) Return user profile

  const {username} = req.params
  if (!username?.trim()) {
    throw new ApiError(400, 'Username is missing');
  }

  const channel=await User.aggregate([
    {
      $match:{
        username: username.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
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
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$subscribedTo" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
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
        email: 1,
        createdAt: 1,
      }
    }
  ])
  if(!channel?.length) {
    throw new ApiError(404, 'Channel not found');
  }
  return res
  .status(200)
  .json(new ApiResponse(200, channel[0], 'User channel profile fetched successfully'));
})




// Exporting the functions to be used in routes
export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken,
  changeCurrentPassword, 
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile
};
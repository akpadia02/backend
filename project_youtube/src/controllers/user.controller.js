// import asyncHandler from '../utils/asyncHandler.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

export { registerUser, loginUser, logoutUser };
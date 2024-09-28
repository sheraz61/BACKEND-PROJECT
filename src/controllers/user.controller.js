import asyncHandler from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { apiResponse } from '../utils/apiResponse.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils//cloudinary.js'
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    //update user object in db
    user.refreshtoken = refreshToken
    //save user object in db
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new apiError(500, "something went wrong while generating refresh and access token")
  }
}
const registerUser = asyncHandler(async (req, res) => {
  //get user detail from frontend
  const { fullname, email, username, password } = req.body
  //validation  - not empty
  //validate user input : not empty, not null, not undefined, not empty string
  if (
    [fullname, email, username, password].some((value) => value?.trim() === "")
  ) {
    throw new apiError(400, 'All fields are required')
  }
  //otherwise check each input using if else
  //   if(fullname===''){
  //     throw new apiError(400,'Fullname is required')
  //   }

  //check if user already exists : username and email
  const existedUser = await User.findOne({
    //option to check feild if user already exists
    $or: [
      { email }, { username }
    ]
  })
  if (existedUser) {
    throw new apiError(409, 'User already exists')
  }

  // console.log(req.files);

  //check if avatar exists : avatar ,check if cover image exists : cover
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImagePath=req.files?.coverimage[0]?.path;
  //2nd way to check cover image if null value then handle the conditon  
  let coverImagePath;
  if (req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
    coverImagePath = req.files.coverimage[0].path;
  }
  if (!avatarLocalPath) {
    throw new apiError(400, 'Avatar not found')
  }
  //upload them to cloudinary, avatar check after upload
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverimage = await uploadOnCloudinary(coverImagePath)
  if (!avatar) {
    throw new apiError(400, 'Avatar not found')
  }
  //create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverimage: coverimage?.url || '',
    email,
    password,
    username: username.toLowerCase()
  })
  //remove password and refresh token feild form response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshtoken"
  )
  //check for user creation
  if (!createdUser) {
    throw new apiError(500, 'User not created')
  }
  //return response

  return res.status(201).json(
    new apiResponse(200, createdUser, "User Registered Successfully")
  )
})

const loginUser = asyncHandler(async (req, res) => {
  //req.body-->data
  const { email, password, username } = req.body;
  //username or email to login
  if (!(username || email)) {
    throw new apiError(400, 'Email or username is required')
  }
  //find user
  const user = await User.findOne({
    $or: [
      { email }, { username }
    ]
  })
  if (!user) {
    throw new apiError(404, 'Invalid credentials')
  }
  //password check
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new apiError(401, 'Invalid password')
  }
  //access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  //hide refresh token and password from user response
  const loggedInUser = await User.findById(user._id).select("-password -refreshtoken")
  //send cookies
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
      )
    )
  //response for login
})
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        refreshtoken: undefined
      }
    },
    {
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshtoken", options)
    .json(new apiResponse(200, {}, "User logged out successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser
} 